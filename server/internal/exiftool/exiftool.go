// Package exiftool 让 ExifTool 常驻运行（-stay_open 模式），读每张照片时不用重新启动一次 Perl。
// 每次启动要几十毫秒，比读一张照片的元数据还慢，大批量导入时差别很明显。
//
// 协议：exiftool -stay_open True -@ - 从标准输入一行读一个参数，读到 -executeN 就执行，
// 执行完在标准输出打印 {readyN}。另外用 -echo4 在标准错误末尾也打一个标记，好知道错误信息读到哪里为止。
package exiftool

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// Pool 管理若干个常驻的 exiftool 进程，按需启动，最多 size 个，可以并发使用。
type Pool struct {
	args  []string      // 每次执行都带的参数
	idle  chan *process // 空闲的进程
	slots chan struct{} // 已启动的进程数，满了就只能等空闲的

	mu     sync.Mutex
	closed bool
}

// NewPool 创建进程池。args 是每次执行都带的参数，例如 "-json", "-n"。
func NewPool(size int, args ...string) *Pool {
	return &Pool{
		args:  args,
		idle:  make(chan *process, size),
		slots: make(chan struct{}, size),
	}
}

// Run 执行一次 exiftool（相当于 exiftool <公共参数> <extra...>），返回标准输出。
// 标准输出为空时视为失败，错误信息取自标准错误，例如 "Error: File not found - ..."。
func (p *Pool) Run(ctx context.Context, extra ...string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	proc, err := p.acquire(ctx)
	if err != nil {
		return nil, err
	}
	out, err := proc.run(ctx, append(append([]string{}, p.args...), extra...))
	p.release(proc)
	return out, err
}

// Close 让所有空闲进程退出。正在使用的进程会在用完时退出。
func (p *Pool) Close() {
	p.mu.Lock()
	p.closed = true
	p.mu.Unlock()
	for {
		select {
		case proc := <-p.idle:
			proc.close()
		default:
			return
		}
	}
}

func (p *Pool) acquire(ctx context.Context) (*process, error) {
	p.mu.Lock()
	closed := p.closed
	p.mu.Unlock()
	if closed {
		return nil, errClosed
	}
	select {
	case proc := <-p.idle:
		return proc, nil
	default:
	}
	select {
	case proc := <-p.idle:
		return proc, nil
	case p.slots <- struct{}{}:
		proc, err := start()
		if err != nil {
			<-p.slots
			return nil, err
		}
		return proc, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// release 把进程放回池里；进程坏了（超时被杀、意外退出）就丢掉，下次按需重新启动。
func (p *Pool) release(proc *process) {
	p.mu.Lock()
	closed := p.closed
	p.mu.Unlock()
	if proc.broken || closed {
		proc.close()
		<-p.slots
		return
	}
	p.idle <- proc
}

type process struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout *bufio.Reader
	stderr *bufio.Reader
	seq    int
	broken bool
}

func start() (*process, error) {
	cmd := exec.Command("exiftool", "-stay_open", "True", "-@", "-")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("启动 exiftool: %w", err)
	}
	return &process{cmd: cmd, stdin: stdin, stdout: bufio.NewReader(stdout), stderr: bufio.NewReader(stderr)}, nil
}

type result struct {
	out, errOut []byte
	err         error
}

func (p *process) run(ctx context.Context, args []string) ([]byte, error) {
	var b strings.Builder
	for _, a := range args {
		// 参数按行传，带换行的参数（例如文件名里有换行）没法传
		if strings.ContainsAny(a, "\r\n") {
			return nil, fmt.Errorf("exiftool 参数里不能有换行: %q", a)
		}
		b.WriteString(a)
		b.WriteByte('\n')
	}
	p.seq++
	marker := fmt.Sprintf("{ready%d}", p.seq)
	fmt.Fprintf(&b, "-echo4\n%s\n-execute%d\n", marker, p.seq)

	if _, err := io.WriteString(p.stdin, b.String()); err != nil {
		p.broken = true
		return nil, fmt.Errorf("exiftool: %w", err)
	}

	done := make(chan result, 1)
	go func() {
		// 先读完标准输出再读标准错误：错误信息很短，在管道缓冲区里等着不会卡住 exiftool
		out, err := readUntil(p.stdout, marker)
		if err != nil {
			done <- result{err: err}
			return
		}
		errOut, err := readUntil(p.stderr, marker)
		done <- result{out: out, errOut: errOut, err: err}
	}()

	select {
	case r := <-done:
		if r.err != nil {
			p.broken = true
			return nil, fmt.Errorf("exiftool 意外退出: %w", r.err)
		}
		if len(bytes.TrimSpace(r.out)) == 0 {
			return nil, fmt.Errorf("exiftool: %s", strings.TrimSpace(string(r.errOut)))
		}
		return r.out, nil
	case <-ctx.Done():
		// 不知道 exiftool 还要多久，只能杀掉；管道关闭后读取的 goroutine 会退出
		p.broken = true
		p.cmd.Process.Kill()
		<-done
		return nil, ctx.Err()
	}
}

// readUntil 一行一行读，直到读到只有 marker 的一行，返回之前的内容。
func readUntil(r *bufio.Reader, marker string) ([]byte, error) {
	var buf bytes.Buffer
	for {
		line, err := r.ReadBytes('\n')
		if string(bytes.TrimRight(line, "\r\n")) == marker {
			return buf.Bytes(), nil
		}
		buf.Write(line)
		if err != nil {
			return nil, err
		}
	}
}

// close 让进程正常退出；几秒内没退出就强制结束。
func (p *process) close() {
	io.WriteString(p.stdin, "-stay_open\nFalse\n")
	p.stdin.Close()
	exited := make(chan struct{})
	go func() {
		p.cmd.Wait()
		close(exited)
	}()
	select {
	case <-exited:
	case <-time.After(3 * time.Second):
		p.cmd.Process.Kill()
		<-exited
	}
}

var errClosed = errors.New("exiftool 进程池已关闭")
