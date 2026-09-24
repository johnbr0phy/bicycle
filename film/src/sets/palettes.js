'use strict';
// Shared palettes for the street sets, derived from the lane palettes so colour stays locked across sets.
const C = require('../engine/core'); const Lane = require('./lane');
function ext(p, o) { return Object.assign({}, p, o); }
const P = {};
P.morning = ext(Lane.PALS.day, { skyLow: '#e8ecf0', asphalt: '#a9a4b0', asphalt2: '#9d98a6', asphalt3: '#b7b2bc', channel: '#8a8894', light: '#fff2d0', wood: '#86684e', lattice: '#6c4e3c', plaster: '#e6dbc6', interior: '#4a3c38', doorPaper: '#ece2cf' });
P.dawn = ext(Lane.PALS.dawn, { asphalt: '#aaa2b8', asphalt2: '#9e96ae', asphalt3: '#b6aec4', channel: '#8a82a0' });
P.noon = ext(Lane.PALS.day, { asphalt: '#b0aab2', asphalt2: '#a49ea8', asphalt3: '#bcb6be', channel: '#908c96' });
P.afternoon = ext(Lane.PALS.day, { skyTop: '#a9c3d6', skyLow: '#f3dcb4', light: '#ffe3ad', wood: '#9c7148', plaster: '#f2e4cc', stone: '#c9bba5', asphalt: '#b3a698', asphalt2: '#a89a8c', asphalt3: '#bfb2a4', channel: '#958878', haze: '#f3dcc0' });
P.dusk = ext(Lane.PALS.dusk, { asphalt: '#8a7c90', asphalt2: '#7e7086', asphalt3: '#96889c', channel: '#6e6078' });
P.night = ext(Lane.PALS.night, { asphalt: '#44465e', asphalt2: '#3c3e56', asphalt3: '#4c4e66', channel: '#34364c' });
P.nightwet = ext(Lane.PALS.night, { asphalt: '#3a3c56', asphalt2: '#33354e', asphalt3: '#46486a', channel: '#2c2e44', stone: '#44466a' });
module.exports = P;
