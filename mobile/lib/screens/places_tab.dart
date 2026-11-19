import 'package:material_ui/material_ui.dart';

import '../i18n.dart';
import 'people_tab.dart';

/// Footprints: the map of where photos were taken. Not built yet.
class PlacesTab extends StatelessWidget {
  const PlacesTab({super.key});

  @override
  Widget build(BuildContext context) => TabPage(
    title: t('足迹'),
    child: SliverToBoxAdapter(
      child: Empty(icon: Icons.map_outlined, text: t('地图很快就来')),
    ),
  );
}
