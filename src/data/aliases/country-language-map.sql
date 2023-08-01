/*
  this SQL script can be used to regenerate the 'country-language-map.json' file.

  at time of writing the required 'whosonfirst-data-country-latest.db' file isn't
  distributed by Geocode Earth, you can generate it manually from the bundle file:

  > aria2c https://data.geocode.earth/wof/dist/legacy/whosonfirst-data-country-latest.tar.bz2
  > npm i -g @whosonfirst/wof
  > wof bundle export whosonfirst-data-country-latest.tar.bz2 | wof sqlite import whosonfirst-data-country-latest.db
*/

SELECT json_group_object(id, json)
FROM (
  SELECT *, json_object(
    'id', id,
    'placetype', json_extract(body, '$.properties.wof:placetype'),
    'name', json_extract(body, '$.properties.wof:name'),
    'spoken', IFNULL(json_extract(body, '$.properties.wof:lang_x_spoken'), json_array()),
    'official', IFNULL(json_extract(body, '$.properties.wof:lang_x_official'), json_array())
  ) AS json
  FROM geojson
  WHERE json_extract(body, '$.properties.mz:is_current') == 1
);
