package assets

import "testing"

func TestParseCity(t *testing.T) {
	c, err := parseCity("12.5;27.84,-82.7;27.9,-82.71|27.99,-82.74")
	if err != nil {
		t.Fatal(err)
	}
	if c.Km != 12.5 || len(c.Own) != 2 || len(c.Others) != 1 || c.Others[0] != [2]float64{27.99, -82.74} {
		t.Fatalf("parseCity = %+v", c)
	}
	if c, err := parseCity("3;22.5,113.9"); err != nil || len(c.Others) != 0 {
		t.Fatalf("没有别的城市时 = %+v, %v", c, err)
	}
	for _, bad := range []string{"", "3", "0;1,2", "x;1,2", "3;1", "3;100,2", "3;1,2|1"} {
		if _, err := parseCity(bad); err == nil {
			t.Errorf("parseCity(%q) 应该出错", bad)
		}
	}
}
