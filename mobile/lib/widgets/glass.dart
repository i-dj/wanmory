import 'dart:ui';

import 'package:material_ui/material_ui.dart';

/// Frosted glass panel, like the iOS menus and floating buttons.
class Glass extends StatelessWidget {
  const Glass({super.key, required this.child, this.radius = 22, this.padding = EdgeInsets.zero});

  final Widget child;
  final double radius;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHigh.withValues(alpha: 0.72),
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.35)),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// A round frosted button (the "…" in the corner).
class GlassButton extends StatelessWidget {
  const GlassButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.active = false,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;

  /// Highlighted, for example while a filter is on.
  final bool active;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final button = GestureDetector(
      onTap: onPressed,
      child: SizedBox(
        width: 44,
        height: 44,
        child: active
            ? DecoratedBox(
                decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                child: Icon(icon, color: scheme.onPrimary),
              )
            : Glass(radius: 22, child: Icon(icon, color: scheme.onSurface)),
      ),
    );
    return tooltip == null ? button : Tooltip(message: tooltip, child: button);
  }
}

/// A row of a [showGlassMenu] menu.
class GlassMenuItem {
  const GlassMenuItem({
    required this.label,
    required this.onTap,
    this.icon,
    this.leading,
    this.checked = false,
  });

  final String label;
  final IconData? icon;

  /// Shown instead of [icon], for example an avatar.
  final Widget? leading;
  final bool checked;
  final VoidCallback onTap;
}

class GlassMenuSection {
  const GlassMenuSection({this.title, required this.items});

  final String? title;
  final List<GlassMenuItem> items;
}

/// A frosted menu that grows out of the top right corner. [sections] is called again after
/// every tap, so ticks update while the menu stays open (several members can be ticked).
Future<void> showGlassMenu(BuildContext context, {required List<GlassMenuSection> Function() sections}) {
  final top = MediaQuery.paddingOf(context).top + 56;
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black.withValues(alpha: 0.12),
    transitionDuration: const Duration(milliseconds: 180),
    pageBuilder: (context, _, _) => Stack(
      children: [
        Positioned(
          top: top,
          right: 12,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: 300,
              minWidth: 240,
              maxHeight: MediaQuery.sizeOf(context).height - top - 120,
            ),
            child: StatefulBuilder(
              builder: (context, setState) =>
                  _GlassMenu(sections: sections(), onChanged: () => setState(() {})),
            ),
          ),
        ),
      ],
    ),
    transitionBuilder: (context, animation, _, child) {
      final a = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: a,
        child: ScaleTransition(
          scale: Tween(begin: 0.85, end: 1.0).animate(a),
          alignment: Alignment.topRight,
          child: child,
        ),
      );
    },
  );
}

class _GlassMenu extends StatelessWidget {
  const _GlassMenu({required this.sections, required this.onChanged});

  final List<GlassMenuSection> sections;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Material(
      type: MaterialType.transparency,
      child: Glass(
        radius: 28,
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var s = 0; s < sections.length; s++) ...[
                if (s > 0)
                  Divider(
                    height: 14,
                    indent: 20,
                    endIndent: 20,
                    color: scheme.outlineVariant.withValues(alpha: 0.5),
                  ),
                if (sections[s].title != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(56, 6, 20, 4),
                    child: Text(
                      sections[s].title!,
                      style: theme.textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ),
                for (final item in sections[s].items)
                  InkWell(
                    onTap: () {
                      item.onTap();
                      onChanged();
                    },
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 11, 20, 11),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 28,
                            child: item.checked ? Icon(Icons.check, size: 20, color: scheme.primary) : null,
                          ),
                          if (item.leading != null) ...[
                            SizedBox(width: 28, height: 28, child: item.leading),
                            const SizedBox(width: 12),
                          ] else if (item.icon != null) ...[
                            Icon(item.icon, size: 22, color: scheme.onSurface),
                            const SizedBox(width: 14),
                          ],
                          Expanded(
                            child: Text(
                              item.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyLarge,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
