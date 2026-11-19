/// Data types returned by the Wanmory server API (see server/internal/*).
library;

import '../i18n.dart';

class User {
  User({
    required this.id,
    required this.name,
    required this.isAdmin,
    this.avatar,
    this.avatarStyle = '',
    this.locale = '',
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'] as String,
    name: j['name'] as String,
    isAdmin: j['is_admin'] as bool? ?? false,
    avatar: j['avatar'] as String?,
    avatarStyle: j['avatar_style'] as String? ?? '',
    locale: j['locale'] as String? ?? '',
  );

  final String id;
  final String name;
  final bool isAdmin;

  /// Asset used as the avatar, or null.
  final String? avatar;

  /// `cartoon:<name>` or `file:<time>`; takes precedence over [avatar] when set.
  final String avatarStyle;

  /// Interface language picked in the web settings; empty means "follow the device".
  final String locale;
}

class Asset {
  Asset({
    required this.id,
    required this.type,
    this.fileName = '',
    this.geo,
    required this.width,
    required this.height,
    required this.durationMs,
    required this.sortTime,
    required this.favorite,
    required this.hasThumbnail,
  });

  factory Asset.fromJson(Map<String, dynamic> j) => Asset(
    id: j['id'] as String,
    type: j['type'] as String,
    width: j['width'] as int?,
    height: j['height'] as int?,
    durationMs: j['duration_ms'] as int?,
    sortTime: DateTime.parse(j['sort_time'] as String).toLocal(),
    favorite: j['favorite'] as bool? ?? false,
    hasThumbnail: j['has_thumbnail'] as bool? ?? false,
  );

  final String id;

  /// "image", "video" or "audio".
  final String type;
  final String fileName;

  /// The city the photo was taken in, looked up by the server; null without coordinates.
  final Geo? geo;
  final int? width;
  final int? height;
  final int? durationMs;

  /// Position on the timeline: capture time, or the file time when there is none.
  final DateTime sortTime;
  final bool favorite;
  final bool hasThumbnail;

  bool get isVideo => type == 'video';

  static final _raw = RegExp(r'\.(dng|cr2|cr3|nef|arw|raf|orf|rw2|pef|srw)$', caseSensitive: false);

  bool get isRaw => _raw.hasMatch(fileName);
}

/// A city from reverse geocoding, with Chinese and English names.
class Geo {
  Geo({required this.city, this.cityEn, this.country, this.countryCode});

  factory Geo.fromJson(Map<String, dynamic> j) => Geo(
    city: j['city'] as String,
    cityEn: j['city_en'] as String?,
    country: j['country'] as String?,
    countryCode: j['country_code'] as String?,
  );

  final String city;
  final String? cityEn;
  final String? country;
  final String? countryCode;

  bool get _zh => currentLocale.startsWith('zh');

  String get localCity => _zh ? city : (cityEn ?? city);

  /// The country name in Chinese; elsewhere the flag (the server only stores Chinese country names).
  String? get localCountry {
    if (_zh) return country;
    final code = countryCode?.toUpperCase();
    if (code == null || code.length != 2) return null;
    return String.fromCharCodes(code.codeUnits.map((c) => 0x1F1E6 + c - 65));
  }
}

/// Photo and video counts of the library.
class Summary {
  Summary(this.photos, this.videos);

  factory Summary.fromJson(Map<String, dynamic> j) => Summary(j['photos'] as int, j['videos'] as int);

  final int photos;
  final int videos;
}

class Person {
  Person({required this.id, required this.name, required this.assets, this.cover});

  factory Person.fromJson(Map<String, dynamic> j) => Person(
    id: j['id'] as String,
    name: j['name'] as String? ?? '',
    assets: j['assets'] as int? ?? 0,
    cover: j['cover'] as String?,
  );

  final String id;

  /// Empty until someone names the person.
  final String name;
  final int assets;

  /// Face ID used as the portrait.
  final String? cover;
}

class Album {
  Album({
    required this.id,
    required this.name,
    required this.count,
    this.cover,
    this.kind = 'normal',
    this.autoSync = false,
  });

  factory Album.fromJson(Map<String, dynamic> j) => Album(
    id: j['id'] as String,
    name: j['name'] as String,
    count: j['count'] as int? ?? 0,
    cover: j['cover'] as String?,
    kind: j['kind'] as String? ?? 'normal',
    autoSync: j['auto_sync'] as bool? ?? false,
  );

  final String id;
  final String name;
  final int count;

  /// Asset ID of the cover photo; null while the album is empty.
  final String? cover;

  /// "normal" or "smart".
  final String kind;

  /// A smart album that keeps following its rules; photos can't be added or removed by hand.
  final bool autoSync;

  bool get synced => kind == 'smart' && autoSync;
}

/// Which assets a timeline shows (the query parameters of GET /api/assets).
class AssetFilter {
  const AssetFilter({
    this.kind,
    this.favorite = false,
    this.q,
    this.person,
    this.album,
    this.notAlbum,
    this.uploaders = const [],
  });

  /// "photo", "video" or "gif"; null for all.
  final String? kind;
  final bool favorite;

  /// Search by meaning ("sunset at the beach"); results come ranked, not by date.
  final String? q;
  final String? person;
  final String? album;

  /// Leave out photos already in this album (when picking photos to add).
  final String? notAlbum;

  /// Only photos uploaded by these members; empty for everyone.
  final List<String> uploaders;

  bool get filtered => kind != null || favorite || uploaders.isNotEmpty;

  bool get ranked => q != null;

  AssetFilter copyWith({String? kind, bool clearKind = false, bool? favorite, List<String>? uploaders}) =>
      AssetFilter(
        kind: clearKind ? null : (kind ?? this.kind),
        favorite: favorite ?? this.favorite,
        q: q,
        person: person,
        album: album,
        notAlbum: notAlbum,
        uploaders: uploaders ?? this.uploaders,
      );

  String get query {
    final p = <String, String>{
      'kind': ?kind,
      if (favorite) 'favorite': 'true',
      'q': ?q,
      'person': ?person,
      'album': ?album,
      'not_album': ?notAlbum,
      if (uploaders.isNotEmpty) 'uploader': uploaders.join(','),
    };
    return Uri(queryParameters: p).query;
  }
}

class AssetPage {
  AssetPage(this.items, this.nextCursor);

  factory AssetPage.fromJson(Map<String, dynamic> j) => AssetPage([
    for (final a in j['items'] as List) Asset.fromJson(a as Map<String, dynamic>),
  ], j['next_cursor'] as String?);

  final List<Asset> items;
  final String? nextCursor;
}

/// Result of the first sign-in step: either signed in, or a two-step verification ticket.
class LoginResult {
  LoginResult.signedIn(User this.user, String this.token) : ticket = null;
  LoginResult.needsCode(String this.ticket) : user = null, token = null;

  final User? user;
  final String? token;
  final String? ticket;
}
