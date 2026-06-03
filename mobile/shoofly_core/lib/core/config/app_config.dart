import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

enum Environment { dev, staging, production }

class AppConfig {
  static Environment _environment = Environment.dev;

  /// Override via `--dart-define=API_BASE_URL=http://your-ip:5000`
  static const String _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  /// Override via `--dart-define=DEV_HOST=192.168.1.X`
  /// Set this to your machine's LAN IP when running on a physical Android device.
  /// Leave empty to use the Android emulator default (10.0.2.2).
  static const String _devHostOverride = String.fromEnvironment('DEV_HOST');

  static void setEnvironment(Environment env) {
    _environment = env;
  }

  static Environment get environment => _environment;

  static bool get isDev => _environment == Environment.dev;
  static bool get isStaging => _environment == Environment.staging;
  static bool get isProduction => _environment == Environment.production;

  static String get apiBaseUrl {
    // Explicit override always wins
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;

    switch (_environment) {
      case Environment.dev:
        if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
          // 10.0.2.2 → Android emulator's alias for the host machine's localhost.
          // For a physical device, pass --dart-define=DEV_HOST=<your-lan-ip>
          final host = _devHostOverride.isNotEmpty ? _devHostOverride : '192.168.1.18';
          return 'http://$host:5000';
        }
        return 'http://192.168.1.18:5000';
      case Environment.staging:
        return 'https://staging-api.shoofly-egy.com';
      case Environment.production:
        return 'https://api.shoofly-egy.com';
    }
  }

  static String get apiVersion => '';
  static String get fullApiUrl => '$apiBaseUrl/api';

  static String getImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$apiBaseUrl$cleanPath';
  }

  static Duration get defaultTimeout => const Duration(seconds: 30);
  static Duration get uploadTimeout => const Duration(minutes: 2);
}
