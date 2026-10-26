import { PresetScenario } from '../types/diy';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'drywall_anchor_blowout',
    title: 'Drywall Heavy Anchor Tear-Out',
    category: 'Drywall & Wall Repair',
    subtitle: 'Blown out 1.5" hole in 1/2" drywall from overloaded shelf anchor',
    difficulty: 'Beginner',
    estimatedTime: '45 mins (plus mud dry time)',
    imagePath: '/src/assets/images/diy_drywall_repair_1792409757414.jpg',
    userPrompt: 'The shelf anchor pulled straight out of the drywall and took a chunk of plaster with it. I need to re-mount a 30lb floating shelf in the exact same spot.',
  },
  {
    id: 'copper_pipe_pinhole_leak',
    title: 'Under-Sink Copper Pipe Pinhole Leak',
    category: 'Plumbing',
    subtitle: 'Active micro-spray with verdigris corrosion on cold water copper riser',
    difficulty: 'Intermediate',
    estimatedTime: '60 mins',
    imagePath: '/src/assets/images/diy_copper_pipe_leak_1792409759010.jpg',
    userPrompt: 'Water is shooting out of a tiny pinhole on the copper pipe under my bathroom vanity. Bucket is catching drips, need immediate reliable repair.',
  },
  {
    id: 'electrical_outlet_upgrade',
    title: 'Kitchen GFCI Outlet Replacement',
    category: 'Electrical',
    subtitle: 'Old 2-prong ungrounded box needing modern 20A tamper-resistant GFCI',
    difficulty: 'Intermediate',
    estimatedTime: '30 mins',
    imagePath: '/src/assets/images/diy_electrical_outlet_1792409759240.jpg',
    userPrompt: 'Replacing an old worn wall receptacle with a modern 20-amp tamper-resistant GFCI receptacle near the kitchen sink. Power is off at the panel.',
  },
  {
    id: 'cracked_floor_tile',
    title: 'Cracked Laundry Room Floor Tile',
    category: 'Tiling & Flooring',
    subtitle: 'Fractured 12x12 porcelain tile with crumbling surrounding grout',
    difficulty: 'Intermediate',
    estimatedTime: '1.5 hrs',
    imagePath: '/src/assets/images/diy_cracked_floor_tile_1792409759562.jpg',
    userPrompt: 'Heavy appliance dropped and shattered one floor tile. Surrounding tiles are intact, but need to extract the broken piece, clean thinset, and reset replacement.',
  },
];
