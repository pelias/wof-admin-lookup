>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias Who's On First Admin Lookup

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/wof-admin-lookup.svg)](https://greenkeeper.io/)
![Travis CI Status](https://travis-ci.org/pelias/wof-admin-lookup.svg)

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
[pip service](https://github.com/pelias/pip-service) or load data into memory. It's recommended to use
remote service in all cases (see downsides section bellow).
 
### Configuration

Who's On First Admin Lookup module recognizes the following top-level properties in your pelias.json config file:

```
{
  "imports": {
    "adminLookup": {
      "enabled": true
    },
    // NOT RECOMMENDED: getting data from folder
    "whosonfirst": {
      "datapath": "/path/to/wof-data"
    },
    "services": {
      // getting data from remote pip service
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
