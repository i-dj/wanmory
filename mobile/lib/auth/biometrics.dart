import 'dart:io';

import 'package:local_auth/local_auth.dart';
import 'package:logging/logging.dart';

import '../i18n.dart';

final _log = Logger('biometrics');

/// Face ID / Touch ID / fingerprint unlock.
class Biometrics {
  final _auth = LocalAuthentication();

  /// Whether the enrolled biometric is the face (Face ID / face unlock), after [label].
  bool face = false;

  /// The name of the enrolled biometric ("Face ID", "fingerprint"...), or null when none is set up.
  Future<String?> label() async {
    try {
      if (!await _auth.isDeviceSupported()) return null;
      final types = await _auth.getAvailableBiometrics();
      if (types.isEmpty) return null;
      face = types.contains(BiometricType.face);
      if (face) return Platform.isIOS ? t('面容 ID') : t('面部识别');
      if (Platform.isIOS) return t('触控 ID');
      return t('指纹');
    } on Exception catch (e) {
      _log.warning('cannot check biometrics', e);
      return null;
    }
  }

  /// Shows the system prompt. Falls back to the device passcode when biometrics fail repeatedly.
  Future<bool> authenticate() async {
    try {
      return await _auth.authenticate(localizedReason: t('解锁万象'), persistAcrossBackgrounding: true);
    } on Exception catch (e) {
      _log.warning('authentication failed', e);
      return false;
    }
  }
}
