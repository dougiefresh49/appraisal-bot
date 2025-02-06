# Deed Link Notes

## Context

Given parcel id: 00200.03498.00000
And Url of: https://search.ectorcad.org/parcel/00200.03498.00000
there is a `Last Sale Instrument` field with value: 2019-17663

The deed link to that instrument is: https://ectorcountytx-web.tylerhost.net/web/document/DOCCRP-2019-17663-WD?search=DOCSEARCH144S1

giving the template url of: https://ectorcountytx-web.tylerhost.net/web/document/DOCCRP-${instrument}-WD?search=DOCSEARCH144S1

## HTML of ecad parcel page

```html
<table class="grid grid-1d  wide">
  <tbody>
    <tr>
      <th>Location</th>
      <td class="">508 W HILLMONT RD</td>
    </tr>
    <tr>
      <th>Use Code</th>
      <td class="">
        <a target="_blank" href="/lu/r/use/F1">F1: Commercial Real Estate</a>
      </td>
    </tr>
    <tr>
      <th>Tax District</th>
      <td class="">
        <a target="_blank" href="/lu/r/tax_grp/002">002: COU ECISD ECHD OC </a>
      </td>
    </tr>
    <tr>
      <th>Map Parcel</th>
      <td class="">10</td>
    </tr>
    <tr>
      <th>Acreage</th>
      <td class="">3.5200</td>
    </tr>
    <tr>
      <th>Block</th>
      <td class="">37</td>
    </tr>
    <tr>
      <th>Last Sale Date</th>
      <td class="">10/01/2019</td>
    </tr>
    <tr>
      <th>Last Sale Instrument</th>
      <td class="">2019-17663</td>
    </tr>
    <tr>
      <th>Subdivision</th>
      <td class="">
        <a target="blank" href="/lu/r/subdiv/00200">AIRWAY ACRES </a>
      </td>
    </tr>
  </tbody>
</table>
```

## Task

create a chrome extension that will turn the `Last Sale Instrument` field into a clickable link.
