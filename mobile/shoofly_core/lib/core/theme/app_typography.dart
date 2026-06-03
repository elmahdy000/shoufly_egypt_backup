import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  static TextStyle get baseStyle => GoogleFonts.cairo();

  static TextStyle get h1 => baseStyle.copyWith(
        fontSize: 34,
        fontWeight: FontWeight.bold,
        height: 1.3,
      );

  static TextStyle get h2 => baseStyle.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        height: 1.3,
      );

  static TextStyle get h3 => baseStyle.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.4,
      );

  static TextStyle get h4 => baseStyle.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  static TextStyle get headlineSmall => baseStyle.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  static TextStyle get bodyLarge => baseStyle.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.normal,
        height: 1.5,
      );

  static TextStyle get bodyMedium => baseStyle.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        height: 1.5,
      );

  static TextStyle get labelLarge => baseStyle.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.5,
      );

  static TextStyle get labelMedium => baseStyle.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );

  static TextStyle get bodySmall => baseStyle.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        height: 1.5,
      );

  static TextStyle get labelSmall => baseStyle.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );
}
