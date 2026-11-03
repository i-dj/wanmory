-- 共享相册可以只给几个家庭成员看：album_members 里列着能看的人。共享相册在这里一行都没有时是全家都能看
-- （以后新加的成员也能看）；私有相册不看这张表，只有主人。见 internal/assets/albums.go 的 albumVisible
-- +goose Up
CREATE TABLE album_members (
  album_id UUID NOT NULL REFERENCES albums (id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (album_id, user_id)
);
CREATE INDEX album_members_user_idx ON album_members (user_id);

-- +goose Down
DROP TABLE album_members;
