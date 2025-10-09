# NHL '94 Lineup Editor - TODO List

This file tracks upcoming tasks and feature requests for the application.

## Future Ideas
- [ ] Add ability to edit player attributes directly from the attribute card modal.
- [ ] Add a "Reset Team" button to revert changes for the currently selected team.

## Done
- [x] Add History to show each change that was made to the lines in a seperate modal similar to the rominfoModal. Almost like an audit.
- [x] Fix player positions, as they are incorrect for defensemen and forwards in the parsed data. The role assignment logic needs review.
- [x] When the app starts (before a ROM is loaded), there should be no players or teams loaded. The UI should reflect an empty/initial state.
- [x] Parse line data from ROM and add to team data structure.
- [x] Populate lineup UI from parsed line data.
- [x] Change the Attribute Names when the poistion is goalie on playercard and attributecardmodal
- [x] Change "Shoots" to "Glove Hand" / "Glove" for goalies on player cards.
- [x] On the player card, display weight attribute value. (e.g., "Wt: 6/188")
- [x] Update goalie player card to show goalie-specific attributes (GLL/GLR, STL/STR, PCK).
- [x] Update goalie player card to show DFA/PCK instead of just PCK.
- [x] Implement saving/patching the ROM with lineup changes.
- [x] Fix the Save / patch Rom so we can make changes to multiple teams before having to save / patch the rom.
