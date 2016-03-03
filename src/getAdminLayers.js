/* Look up which admin fields should be populated for a record in a given layer.
 *
 * The logic is: look up eveything above in the WOF heirarchy, ignoring things like
 * 'dependency'
 *
 * Note: this filtering really only matters for geonames currently, since OSM and OA
 * consist entirely of venue and address records, which should have all fields
 * looked up. WOF documents use the actual WOF heirarchy to fill in admin values,
 * so they also won't be affected by this.
 */
function getAdminLayers(layer) {
  switch (layer) {
    case 'region':
        return ['country', 'macroregion'];
    case 'county':
        return ['country', 'macroregion', 'region', 'macrocounty'];
    case 'locality':
        return ['country', 'macroregion', 'region', 'macrocounty', 'county'];
    default:
        return undefined;//undefined means use all layers as normal
  }
}

module.exports = getAdminLayers;
