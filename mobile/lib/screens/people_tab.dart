import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/account_sheet.dart';
import 'person_screen.dart';

/// People found by face recognition; named people first.
class PeopleTab extends ConsumerStatefulWidget {
  const PeopleTab({super.key});

  @override
  ConsumerState<PeopleTab> createState() => _PeopleTabState();
}

class _PeopleTabState extends ConsumerState<PeopleTab> {
  late Future<List<Person>> _people = _load();

  Future<List<Person>> _load() async {
    final list = await ref.read(authProvider).api!.people();
    // Named people first; the server already sorts by number of photos.
    return [...list.where((p) => p.name.isNotEmpty), ...list.where((p) => p.name.isEmpty)];
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.watch(authProvider).api!;
    return TabPage(
      title: t('人物'),
      onRefresh: () async {
        setState(() {
          _people = _load();
        });
        await _people;
      },
      child: FutureBuilder<List<Person>>(
        future: _people,
        builder: (context, snap) {
          if (snap.hasError) return SliverToBoxAdapter(child: LoadError(error: snap.error!));
          if (!snap.hasData) return const SliverToBoxAdapter(child: Loading());
          final people = snap.data!;
          if (people.isEmpty) {
            return SliverToBoxAdapter(
              child: Empty(icon: Icons.people_outline, text: t('还没有认出人物')),
            );
          }
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 16,
                crossAxisSpacing: 12,
                childAspectRatio: 0.62,
              ),
              itemCount: people.length,
              itemBuilder: (context, i) => _PersonCard(person: people[i], api: api),
            ),
          );
        },
      ),
    );
  }
}

class _PersonCard extends StatelessWidget {
  const _PersonCard({required this.person, required this.api});

  final Person person;
  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final name = person.name.isEmpty ? t('（没填名字）') : person.name;
    return GestureDetector(
      onTap: () =>
          Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => PersonScreen(person: person))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: double.infinity,
                color: theme.colorScheme.surfaceContainerHighest,
                child: person.cover == null
                    ? Icon(Icons.person, size: 40, color: theme.colorScheme.onSurfaceVariant)
                    : CachedNetworkImage(
                        imageUrl: api.facePortraitUrl(person.cover!),
                        httpHeaders: api.authHeaders,
                        fit: BoxFit.cover,
                      ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
          Text(
            t('{n} 张照片', {'n': person.assets}),
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

/// A tab page: large title with the avatar, pull to refresh, room for the tab bar.
class TabPage extends StatelessWidget {
  const TabPage({super.key, required this.title, required this.child, this.onRefresh, this.action});

  final String title;

  /// A button next to the avatar, such as "new album".
  final Widget? action;

  /// A sliver.
  final Widget child;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    // Opened from Collections (pushed): a back button instead of the account button.
    final pushed = Navigator.of(context).canPop();
    final scroll = CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(pushed ? 4 : 20, 8, 16, 16),
            child: Row(
              children: [
                if (pushed) const BackButton(),
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                if (action != null) ...[action!, const SizedBox(width: 8)],
                if (!pushed) const AccountButton(),
              ],
            ),
          ),
        ),
        child,
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
    return SafeArea(
      bottom: false,
      child: onRefresh == null ? scroll : RefreshIndicator(onRefresh: onRefresh!, child: scroll),
    );
  }
}

class Loading extends StatelessWidget {
  const Loading({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.all(48),
    child: Center(child: CircularProgressIndicator()),
  );
}

class Empty extends StatelessWidget {
  const Empty({super.key, required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 100, horizontal: 32),
      child: Column(
        children: [
          Icon(icon, size: 56, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: 12),
          Text(text, textAlign: TextAlign.center, style: theme.textTheme.titleMedium),
        ],
      ),
    );
  }
}

class LoadError extends StatelessWidget {
  const LoadError({super.key, required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(32),
    child: Text(
      error is ApiException ? t((error as ApiException).message) : t('服务器内部错误'),
      textAlign: TextAlign.center,
      style: TextStyle(color: Theme.of(context).colorScheme.error),
    ),
  );
}
