package version

import "testing"

func TestNewer(t *testing.T) {
	for _, c := range []struct {
		a, b string
		want bool
	}{
		{"0.2.2", "0.2.1", true}, {"v0.10.0", "0.9.9", true}, {"0.2.1", "0.2.1", false},
		{"0.2.0", "0.2.1", false}, {"1.0", "0.9.9", true}, {"0.3.0", "dev", true}, {"dev", "0.1.0", false},
	} {
		if got := Newer(c.a, c.b); got != c.want {
			t.Errorf("Newer(%q, %q) = %v", c.a, c.b, got)
		}
	}
}
