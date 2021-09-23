>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias Who's On First Admin Lookup

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/wof-admin-lookup.svg)](https://greenkeeper.io/)

## Overview

### What is admin lookup?

When collecting data for use in a [geocoder](https://en.wikipedia.org/wiki/Geocoding),
it's obviously important to know which city, country, etc each record belongs
to. Collectively we call these fields the admin hierarchy.

Not every data source contains this information, and even those that do don't
always have it consistently. So, for Pelias we actually ignore _all_ admin
hierarchy information from individual records, and generate it ourselves from
the polygon data in [Who's on First](http://whosonfirst.mapzen.com/). This
process is called admin lookup.

### How does admin lookup work?

Admin lookup is essentially [reverse geocoding](https://en.wikipedia.org/wiki/Reverse_geocoding):
given the latitude and longitude of a point, populate the admin hierarchy by
finding all the polygons for countries, cities, neighborhoods, and other admin
fields that contain the point.

### Usage

There are two possible ways to retrieve admin hierarchy: using remote
[pip service](https://github.com/pelias/pip-service) or load data into memory.

#### Remote PIP service (experimental, lower memory requirements)

The remote PIP service is a good option only if memory is constrained and you'd
like to share one instance of admin lookup data across multiple importers.

The Remote PIP service is automatically enabled if the `imports.services.pip.url` property exists.

#### Local admin lookup (default, fastest)

Local admin lookup means that each importer needs a copy of admin lookup data available on local
disk.

The property `imports.whosonfirst.datapath` configures where the importers will look.

Even though local admin lookup requires that _each_ importer load a full copy of admin lookup data
(~8GB for the full planet) into memory, it's much faster because there is no network communication.
It's recommended for most uses.

### Configuration

Who's On First Admin Lookup module recognizes the following top-level properties in your pelias.json config file:

```
{
  "imports": {
    "adminLookup": {
      "enabled": true
    },
    "whosonfirst": {
      "datapath": "/path/to/wof-data"
    },
    "services": {
      "pip": {
        "url": "https://mypipservice.com"
      }
    }
  }
}
```

### What are the downsides of storing data in memory?

There are two: admin lookup slows down the process of loading data into Pelias,
and it takes quite a bit of memory. Based on the current amount of data in Who's
on First, count on using at least 4 or 5 GB of memory _just_ for admin lookup
while importing.

### Postal Cities

This module comes bundled with data files which define a mapping between postal codes and their corresponding city name(s).

This is particularly helpful in places where the locality name returned by the point-in-polygon system differs from the locality name commonly used by residents of that postcode.

#### Contributing

The mapping files are open-data, you can find more infomation about [how the data files are generated here](https://github.com/pelias/lastline).

In the `src/data` directory of this repository you'll find the TSV (tab separated) files named after the corresponding 3-character country code (eg. `AUS.tsv`).

Instead of editing these files directly (and risking the work being lost on the next regeneration of the files), you should add your changes to an 'override file', for example `USA.override.tsv`.

These override files are intended for contribution from humans, so your data is safe!

The TSV columns are (in order left-to-right):
|name|type|comment|
|:-:|:-:|:--|
|postalcode|string|postal code eg. `90210`|
|wofid|number|corresponding [WhosOnFirst](https://whosonfirst.org) ID|
|name|string|name of the city/town/burough/hamlet etc.|
|abbr|string|an abbreviation of the name (where available)|
|placetype|string|the [WhosOnFirst](https://github.com/whosonfirst/whosonfirst-placetypes) placetype|
|weight|number|an integer representing how many occurrences of this postalcode+wofid we found|

Note that many editors will try to convert tabs to spaces, please ensure that this is not the case before saving your work!

The `abbr` column is optional, if you don't specify an abbreviation please be sure that your line always contains 5 tabs (ie. 6 columns).

The default value for `weight` is `Number.MAX_SAFE_INTEGER` (a very large number), you may wish to specify it lower if you're unsure how correct the entry is.

In the case where there are multiple entries for the same postcode, all of the names are included in the Pelias index and can be used interchangeably to retrieve the document.

The `weight` field is used to determine which entry is the most important, this entry is used to generate the label for display.

#### Configuration

To enable the postal cities functionality, set `imports.adminLookup.usePostalCities` to `true` in your `pelias.json` file.

#### Advanced Configuration

It's possible to use your own mapping files by setting `imports.adminLookup.postalCitiesDataPath` to point to a directory of your choice, if the corresponding TSV file is found in your path it will be used in place of the bundled data files. [more information](https://github.com/pelias/wof-admin-lookup/pull/296).
