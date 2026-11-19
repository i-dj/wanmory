package db

import "strings"

// Visible 是「照片 a 看的人 u 看得到」的 SQL 条件（a 是 assets 表的别名，u 是 SQL 参数，例如 $2）。
// 照片默认只有上传的人看得到，别人看得到的情况：
//   - 没有上传人（照片目录导入的、建账号以前传的）：全家都看得到
//   - 上传的人把这张分享给了他（asset_shares），或者把自己传的全部分享给了他（library_shares）
//   - 照片在一个共享相册里，是上传的人自己放进去的（或者相册主人就是上传的人），而看的人能看这个相册
//     （全家的共享相册，或者他是主人、成员）。别人分享给自己的照片放进相册不算，不会转分享出去。
//     自动同步的智能相册没有 album_assets，见 assets.Filter 的 smartOwner
//
//   - 看的人是管理员：所有人的照片都看得到，也能删除这些照片（管理家里的图库）
//
// 访客（没登录）用 uuid.Nil，只看得到全家都能看的。隐藏、删除另外判断：别人隐藏的照片管理员也看不到。
func Visible(a, u string) string {
	return strings.NewReplacer("A.", a+".", "$U", u).Replace(`(A.uploaded_by IS NULL OR A.uploaded_by = $U
		OR EXISTS (SELECT 1 FROM users va WHERE va.id = $U AND va.is_admin)
		OR EXISTS (SELECT 1 FROM asset_shares vs WHERE vs.asset_id = A.id AND vs.user_id = $U)
		OR EXISTS (SELECT 1 FROM library_shares vl WHERE vl.owner_id = A.uploaded_by AND vl.user_id = $U)
		OR EXISTS (SELECT 1 FROM album_assets vx JOIN albums val ON val.id = vx.album_id
			WHERE vx.asset_id = A.id AND NOT val.private
			  AND (val.owner_id = A.uploaded_by OR vx.added_by = A.uploaded_by)
			  AND (val.owner_id = $U
			       OR NOT EXISTS (SELECT 1 FROM album_members vm WHERE vm.album_id = val.id)
			       OR EXISTS (SELECT 1 FROM album_members vm WHERE vm.album_id = val.id AND vm.user_id = $U))))`)
}
