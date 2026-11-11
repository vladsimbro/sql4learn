// Additional original course lessons; existing module IDs, lesson IDs and task IDs are preserved.
import {foundationAdditions} from './curriculum-foundations.js';
import {advancedAdditions} from './curriculum-advanced.js';
export const curriculumAdditions=[...foundationAdditions,...advancedAdditions];
export const curriculumGuides=Object.fromEntries(curriculumAdditions.map(item=>[item.id,item.guide]));
