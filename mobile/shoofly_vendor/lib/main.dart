import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter_android/google_maps_flutter_android.dart';
import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart' as intl;
import 'package:shoofly_core/core/di/injection.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';
import 'package:shoofly_core/presentation/blocs/request/request_bloc.dart';
import 'package:shoofly_core/presentation/blocs/notification/notification_bloc.dart';
import 'package:shoofly_core/presentation/blocs/wallet/wallet_bloc.dart';
import 'package:shoofly_core/presentation/blocs/category/category_bloc.dart';
import 'package:shoofly_core/presentation/blocs/theme/theme_bloc.dart';
import 'package:shoofly_core/presentation/blocs/location/location_bloc.dart';
import 'package:shoofly_core/core/constants/app_strings.dart';
import 'package:shoofly_core/core/theme/app_theme.dart' as core_theme;
import 'presentation/pages/home/vendor_home_page.dart';
import 'presentation/pages/auth/vendor_login_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Use legacy AndroidView renderer to avoid ImageReader buffer exhaustion
  // on Samsung devices with the newer TLHC (TextureLayer Hybrid Composition) renderer.
  final mapsImplementation = GoogleMapsFlutterPlatform.instance;
  if (mapsImplementation is GoogleMapsFlutterAndroid) {
    mapsImplementation.useAndroidViewSurface = true; // Use legacy Hybrid Composition
  }

  intl.Intl.defaultLocale = 'ar_EG';
  await initializeDateFormatting('ar', null);
  await initInjection();
  runApp(const ShooflyVendorApp());
}

class ShooflyVendorApp extends StatelessWidget {
  const ShooflyVendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => sl<AuthBloc>()..add(AuthCheckRequested())),
        BlocProvider(create: (_) => sl<VendorBloc>()),
        BlocProvider(create: (_) => sl<RequestBloc>()),
        BlocProvider(create: (_) => sl<NotificationBloc>()),
        BlocProvider(create: (_) => sl<WalletBloc>()),
        BlocProvider(create: (_) => sl<CategoryBloc>()),
        BlocProvider(create: (_) => sl<LocationBloc>()),
        BlocProvider(create: (_) => sl<ThemeBloc>()..add(LoadTheme())),
      ],
      child: BlocBuilder<ThemeBloc, ThemeState>(
        builder: (context, themeState) {
          return MaterialApp(
            title: AppStrings.vendorAppName,
            debugShowCheckedModeBanner: false,
            theme: core_theme.AppTheme.lightTheme,
            darkTheme: core_theme.AppTheme.darkTheme,
            themeMode: themeState.themeMode,
            locale: const Locale('ar', 'EG'),
            builder: (context, child) {
              return Directionality(
                textDirection: TextDirection.rtl,
                child: child ?? const SizedBox.shrink(),
              );
            },
            home: BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                if (state is Authenticated) {
                  return const VendorHomePage();
                } else if (state is Unauthenticated || state is AuthError) {
                  return const VendorLoginPage();
                } else {
                  return const Scaffold(
                    body: Center(
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
              },
            ),
          );
        },
      ),
    );
  }
}
