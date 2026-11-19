import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'i18n.dart';
import 'log.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  setupLogging();
  await setLocale('');
  runApp(const ProviderScope(child: WanmoryApp()));
}
