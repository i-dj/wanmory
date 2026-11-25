package assets

import "testing"

func TestLowQuality(t *testing.T) {
	ip := func(v int) *int { return &v }
	cases := []struct {
		name string
		a    Asset
		low  bool
	}{
		{"iPhone HEIC", Asset{Type: TypeImage, MimeType: "image/heic", Width: ip(4032), Height: ip(3024), FileSize: 2_200_000}, false},
		{"camera JPEG", Asset{Type: TypeImage, MimeType: "image/jpeg", Width: ip(6000), Height: ip(4000), FileSize: 9_000_000}, false},
		{"saved PNG", Asset{Type: TypeImage, MimeType: "image/png", Width: ip(4000), Height: ip(3000), FileSize: 3_000_000}, true},
		{"small download", Asset{Type: TypeImage, MimeType: "image/jpeg", Width: ip(1000), Height: ip(646), FileSize: 100_000}, true},
		{"tiny file", Asset{Type: TypeImage, MimeType: "image/jpeg", Width: ip(2000), Height: ip(1600), FileSize: 400_000}, true},
		{"recompressed", Asset{Type: TypeImage, MimeType: "image/jpeg", Width: ip(4608), Height: ip(3072), FileSize: 672_000}, true},
		{"no size", Asset{Type: TypeImage, MimeType: "image/jpeg", FileSize: 5_000_000}, true},
		{"video", Asset{Type: TypeVideo, MimeType: "video/mp4", FileSize: 1000}, false},
	}
	for _, c := range cases {
		if got := lowQuality(&c.a); got != c.low {
			t.Errorf("%s: lowQuality = %v, want %v", c.name, got, c.low)
		}
	}
}
