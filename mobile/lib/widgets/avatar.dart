import 'package:cached_network_image/cached_network_image.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';

/// The user's avatar picture, or the first letter of the name.
class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.user, required this.api, this.radius = 18});

  final User user;
  final ApiClient api;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // Cartoon avatars are drawn by the web client; the app shows the initial for them.
    final hasPicture =
        user.avatarStyle.startsWith('file:') || (user.avatarStyle.isEmpty && user.avatar != null);
    final initial = Text(
      user.name.isEmpty ? '?' : user.name.characters.first.toUpperCase(),
      style: TextStyle(fontSize: radius * 0.9, color: scheme.onPrimaryContainer),
    );
    return CircleAvatar(
      radius: radius,
      backgroundColor: scheme.primaryContainer,
      child: hasPicture
          ? ClipOval(
              child: CachedNetworkImage(
                imageUrl: api.avatarUrl(user),
                httpHeaders: api.authHeaders,
                width: radius * 2,
                height: radius * 2,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => Center(child: initial),
              ),
            )
          : initial,
    );
  }
}
