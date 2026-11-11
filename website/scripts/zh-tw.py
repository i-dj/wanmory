# 由简体中文（src/i18n/locales/zh）和 CHANGELOG.md 生成繁体中文（台湾）的语言文件 src/i18n/locales/zh-tw/*.ts。
# 用 OpenCC 的 s2twp（台湾用语）转换，再按下面 FIX 表换成台湾常用说法（相簿、登入、網域、權杖……）。
# 简体中文改了、或 CHANGELOG.md 有新版本时，在 website/ 目录运行：
#   python3 -m venv .venv && .venv/bin/pip install opencc-python-reimplemented && .venv/bin/python scripts/zh-tw.py
# 生成后请人工看一遍改动（git diff）

import re, sys
from opencc import OpenCC
cc = OpenCC('s2twp')
src = 'src/i18n/locales/zh'
dst = 'src/i18n/locales/zh-tw'
TYPES = {'common':'CommonDict','home':'HomeDict','architecture':'ArchitectureDict','docs':'DocsDict','faq':'FaqDict','releases':'ReleasesDict','feedback':'FeedbackDict'}
# 台湾常用说法（在 s2twp 之后再替换）
FIX = [
 ('許可權','權限'),
 ('相冊','相簿'),('智慧相簿','智慧相簿'),('智能','智慧'),('登錄','登入'),('退出登入','登出'),('帳戶','帳號'),('賬號','帳號'),('用戶','使用者'),
 ('顯卡','顯示卡'),('佇列','佇列'),('隊列','佇列'),('鏡像倉庫','映像檔倉庫'),('鏡像','映像檔'),('端口','連接埠'),('局域網','區域網路'),('區域網','區域網路'),('區域網路路','區域網路'),
 ('域名','網域'),('數據卷','磁碟區'),('資料卷','磁碟區'),('命名卷','具名磁碟區'),('令牌','權杖'),('日誌','日誌'),('交互式','互動式'),('支持','支援'),
 ('創建','建立'),('菜單','選單'),('搜索','搜尋'),('粘貼','貼上'),('反饋','回報'),('並發','並行'),('線程','執行緒'),('緩存','快取'),
 ('移動硬碟','外接硬碟'),('移動硬盤','外接硬碟'),('調度','排程'),('實時','即時'),('加載','載入'),('卸載','解除安裝'),
 ('截圖','螢幕截圖'),('螢幕螢幕截圖','螢幕截圖'),('幻燈片','幻燈片'),('縮略圖','縮圖'),('預覽圖','預覽圖'),('視頻','影片'),('質量','品質'),
 ('元數據','中繼資料'),('元資料','中繼資料'),('數據','資料'),('信息','資訊'),('訊息佇列','訊息佇列'),('消息佇列','訊息佇列'),('硬件','硬體'),
 ('高精度','高精度'),('默認','預設'),('文件夾','資料夾'),('目錄','目錄'),('項目','項目'),('源碼','原始碼'),('開源','開源'),('推薦','推薦'),
 ('激活','啟用'),('啟動','啟動'),('運行','執行'),('服務器','伺服器'),('網絡','網路'),('互聯網','網際網路'),('公網','公開網路'),('掛載','掛載'),
 ('分辨率','解析度'),('像素','像素'),('人臉聚類','人臉分群'),('聚類','分群'),('攝像頭','相機'),('樹莓派','樹莓派'),
 ('迷你主機','迷你主機'),('註冊','註冊'),('二次確認','再次確認'),('回收','回收'),('兼容','相容'),('配置','設定'),
 ('編排文件','編排檔'),('程序','程式'),('程式碼','程式碼'),('優化','最佳化'),('最佳化','最佳化'),('宿主機','主機'),
 ('租期','租約'),('永珍','萬象'),('倉庫','儲存庫'),('許可','授權'),('版本釋出','版本發布'),('釋出','發布'),('端側 AI','裝置端 AI'),('自託管','自架'),('（國內）','（中國大陸鏡像）'),('模型級別','模型等級'),('級別','等級'),('質量','品質'),('接口','介面'),('代碼','程式碼'),('模型檔位','模型級別'),('檔位','級別'),('計算設備','運算裝置'),('設備','裝置'),
]
def conv(s):
    s = s.replace('图库', 'QQLIBQQ')
    s = cc.convert(s)
    s = s.replace('QQLIBQQ', '圖庫')
    return s

for name, typ in TYPES.items():
    s = open(f'{src}/{name}.ts').read()
    # 只转换中文部分（代码、英文不受影响）
    s = s.replace('图库', 'QQLIBQQ')
    s = cc.convert(s)
    s = s.replace('QQLIBQQ', '圖庫')
    for a,b in FIX: s = s.replace(a,b)
    for a,b in [('級別','等級'),('映象','映像'),('畫素','像素'),('訪問','存取'),('悉尼','雪梨'),('迪拜','杜拜'),('澳大利亞','澳洲'),('示例','範例'),('引數','參數'),
                ('程式碼塊','程式碼區塊'),('註釋','註解'),('語義','語意'),('推理','推論'),('復現','重現'),('業務資料','應用資料'),('流水線','處理管線'),('生產環境','正式環境'),
                ('識別','辨識'),('型別','類型'),('回復','回覆'),('天后','天後'),('豎圖','直式照片'),('運維','維運'),('雲服務','雲端服務'),('文件頁','文件頁'),('指令碼','腳本'),('64 位','64 位元'),('64 位元元','64 位元'),('新建','新增'),('臺','台'),('演示','展示'),('命令','指令'),('雷克雅未克','雷克雅維克'),('因特拉肯','茵特拉肯'),('存取網域','連線網域'),('存取地址','連線位址'),('地址','位址'),('授權權','權限')]:
        s = s.replace(a,b)
    s = re.sub(r'(?<!接)埠', '連接埠', s)
    # 类型：引用简体中文那份的类型
    s = re.sub(r'\nexport type \w+ = typeof \w+\n', '\n', s)
    s = s.replace('\nexport type DocsBlock = Block\n','\n')
    s = re.sub(r'^const (\w+) = \{', lambda m: f'const {m.group(1)}: {typ} = {{', s, count=1, flags=re.M)
    if name == 'docs':
        s = re.sub(r'\ntype Block =\n(  \|[^\n]*\n)+', '\n', s)
        s = s.replace('] as Block[],', '],')
    s = f"import type {{ {typ} }} from '../zh/{name}'\n\n" + s
    s = s.replace('// 簡體中文', '// 繁體中文（台灣）', 1)
    s = s.replace("untranslated: '',", "untranslated: '此版本的更新說明尚未翻譯，以簡體中文原文顯示。',")
    open(f'{dst}/{name}.ts','w').write(s)
print('ok')

# 更新说明：从 CHANGELOG.md 转成繁体
import json
cl = {}
cur = None
for line in open('../CHANGELOG.md'):
    m = re.match(r'^## (v\d+\.\d+\.\d+) — ', line)
    if m:
        cur = m.group(1); cl[cur] = []
    elif cur and line.startswith('- '):
        cl[cur].append(re.sub(r'^修复：', '', line[2:].strip()))
out = []
for v, notes in cl.items():
    items = []
    for t in notes:
        t = conv(t)
        for a, b in FIX: t = t.replace(a, b)
        items.append('    ' + json.dumps(t, ensure_ascii=False) + ',')
    out.append("  '%s': [\n%s\n  ]," % (v, "\n".join(items)))
head = "// 繁體中文（台灣）· CHANGELOG.md 的譯文：按版本號，每條一句，順序與原文一致（「修復：」前綴用圖示表示，這裡不寫）\n// 版本缺少譯文或條數不一致時顯示簡體中文原文\n\n"
open(f'{dst}/changelog.ts', 'w').write(head + "const changelog: Record<string, string[]> = {\n" + "\n".join(out) + "\n}\n\nexport default changelog\n")
print('changelog ok')
