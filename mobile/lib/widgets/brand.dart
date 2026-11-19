import 'package:material_ui/material_ui.dart';

import '../i18n.dart';

/// App name as the web page title shows it: "Wanmory 万象" in Chinese, "Wanmory" elsewhere.
String get appName => currentLocale.startsWith('zh') ? 'Wanmory ${t('万象')}' : 'Wanmory';

/// Logo and name at the top of the sign-in pages.
class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key, this.subtitle});

  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(Icons.photo_library_rounded, size: 40, color: theme.colorScheme.primary),
        ),
        const SizedBox(height: 16),
        Text(appName, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }
}

/// Centered, width-limited scrolling column used by the sign-in pages.
class FormPage extends StatelessWidget {
  const FormPage({super.key, required this.children, this.appBar});

  final List<Widget> children;
  final PreferredSizeWidget? appBar;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: appBar,
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
          ),
        ),
      ),
    ),
  );
}

class ErrorText extends StatelessWidget {
  const ErrorText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 12),
    child: Text(
      text,
      textAlign: TextAlign.center,
      style: TextStyle(color: Theme.of(context).colorScheme.error),
    ),
  );
}
