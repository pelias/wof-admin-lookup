# Who's On First Admin Lookup

This repository is part of the [Pelias](https://github.com/pelias/pelias)
project. Pelias is an open-source, open-data geocoder built by
[Mapzen](https://www.mapzen.com/) that also powers [Mapzen Search](https://mapzen.com/projects/search). Our
official user documentation is [here](https://mapzen.com/documentation/search/).

![Travis CI Status](https://travis-ci.org/pelias/wof-admin-lookup.svg)

## Overview

### What is admin lookup?

When collecting data for use in a [geocoder](https://en.wikipedia.org/wiki/Geocoding),
it's obviously important to know which city, country, etc each record belongs
to. Collectively we call these fields the admin heirarchy.

Not every data source contains this information, and even those that do don't
always have it consistently. So, for Pelias we actually ignore _all_ admin
heirarchy information from individual records, and generate it ourselves from
the polygon data in [Who's on First](http://whosonfirst.mapzen.com/). This
process is called admin lookup.

### How does admin lookup work?

Admin lookup is essentially [reverse geocoding](https://en.wikipedia.org/wiki/Reverse_geocoding):
given the latitude and longitude of a point, populate the admin heiarchy by
finding all the polygons for countries, cities, neighborhoods, and other admin
fields that contain the point.

### Are there any downsides?

There are two: admin lookup slows down the process of loading data into Pelias,
and it takes quite a bit of memory. Based on the current amount of data in Who's
on First, count on using at least 4 or 5 GB of memory _just_ for admin lookup
while importing.

For these reasons, each of our importers has a configuration option to enable or
disable admin lookup.
