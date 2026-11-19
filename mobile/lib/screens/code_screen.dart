import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/brand.dart';

/// Second sign-in step: the 6-digit code from an authenticator app, or a recovery code.
class CodeScreen extends ConsumerStatefulWidget {
  const CodeScreen({super.key});

  @override
  ConsumerState<CodeScreen> createState() => _CodeScreenState();
}

class _CodeScreenState extends ConsumerState<CodeScreen> {
  final _code = TextEditingController();
  bool _recovery = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _code.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).submitCode(code);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _error = t(e.message));
        _code.clear();
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cancel = ref.read(authProvider.notifier).cancelCode;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) => didPop ? null : cancel(),
      child: FormPage(
        appBar: AppBar(leading: BackButton(onPressed: cancel)),
        children: [
          BrandHeader(subtitle: _recovery ? t('输入一个备用码，每个只能用一次') : t('输入身份验证器里的 6 位验证码')),
          const SizedBox(height: 32),
          TextField(
            key: ValueKey(_recovery),
            controller: _code,
            autofocus: true,
            autocorrect: false,
            textAlign: TextAlign.center,
            keyboardType: _recovery ? TextInputType.visiblePassword : TextInputType.number,
            autofillHints: _recovery ? null : const [AutofillHints.oneTimeCode],
            inputFormatters: _recovery
                ? null
                : [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(letterSpacing: _recovery ? 2 : 8),
            onChanged: (v) {
              if (!_recovery && v.length == 6 && !_busy) _submit();
            },
            onSubmitted: (_) => _busy ? null : _submit(),
            decoration: InputDecoration(
              labelText: _recovery ? t('备用码') : t('验证码'),
              border: const OutlineInputBorder(),
            ),
          ),
          if (_error != null) ErrorText(_error!),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: Text(_busy ? t('正在登录…') : t('验证并登录')),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => setState(() {
              _recovery = !_recovery;
              _error = null;
              _code.clear();
            }),
            child: Text(_recovery ? t('使用验证码') : t('手机不在身边？用备用码')),
          ),
        ],
      ),
    );
  }
}
