import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/brand.dart';

/// Server address, name and password.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _server;
  late final TextEditingController _name;
  final _password = TextEditingController();
  bool _busy = false;
  bool _showPassword = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final s = ref.read(authProvider);
    _server = TextEditingController(text: s.server);
    _name = TextEditingController(text: s.lastName);
    _error = s.message == null ? null : t(s.message!);
  }

  @override
  void dispose() {
    _server.dispose();
    _name.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).signIn(_server.text, _name.text, _password.text);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = t(e.message));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormPage(
      children: [
        BrandHeader(subtitle: t('登录万象')),
        const SizedBox(height: 32),
        Form(
          key: _form,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _server,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('服务器地址'),
                    hintText: '192.168.1.10:8080',
                    helperText: t('例如 192.168.1.10:8080 或 https://photos.example.com'),
                    helperMaxLines: 2,
                    prefixIcon: const Icon(Icons.dns_outlined),
                    border: const OutlineInputBorder(),
                  ),
                  validator: (v) => (v ?? '').trim().isEmpty ? t('请输入服务器地址') : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _name,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.username],
                  decoration: InputDecoration(
                    labelText: t('名字'),
                    prefixIcon: const Icon(Icons.person_outline),
                    border: const OutlineInputBorder(),
                  ),
                  validator: (v) => (v ?? '').trim().isEmpty ? t('请输入名字') : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _password,
                  obscureText: !_showPassword,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  onFieldSubmitted: (_) => _busy ? null : _submit(),
                  decoration: InputDecoration(
                    labelText: t('密码'),
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      tooltip: _showPassword ? t('隐藏密码') : t('显示密码'),
                      icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                    ),
                  ),
                  validator: (v) => (v ?? '').isEmpty ? t('请输入密码') : null,
                ),
              ],
            ),
          ),
        ),
        if (_error != null) ErrorText(_error!),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _busy
              ? null
              : () {
                  TextInput.finishAutofillContext();
                  _submit();
                },
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          child: Text(_busy ? t('正在登录…') : t('登录')),
        ),
      ],
    );
  }
}
