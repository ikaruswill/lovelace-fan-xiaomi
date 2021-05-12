# Xiaomi Fan Lovelace Card
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)

Xiaomi Smartmi Fan Lovelace card for HASS/Home Assistant.

## Features
- Supports [HACS](https://github.com/custom-components/hacs) installation
- CSS fan blade and oscillation animation

### Toggles
- Oscillation
- Natural mode
- Child lock
- Sleep mode

### Cycling
- Speed level
- Oscillation angle
- Timer duration

## Requirements
Either of these two integrations can be used:
- [Xiaomi Mi Smart Pedestal Fan Integration](https://github.com/syssi/xiaomi_fan) v0.3.3
- [Xiaomi Mi Air Purifier & Xiaomi Mi Air Humidifier Integration](https://github.com/syssi/xiaomi_airpurifier) v0.6.9

## HACS Installation
Search for `Xiaomi Smartmi Fan Card`

## Manual Installation
1. Download `fan-xiaomi.js`
1. Copy to `www/community/lovelace-fan-xiaomi/fan-xiaomi.js`
1. Add the following to your Lovelace resources
    ``` yaml
    resources:
    - url: /community_plugin/lovelace-fan-xiaomi/fan-xiaomi.js
      type: js
    ```
    
## Card Configuration

Example of Lovelace config `views.cards` key
```yaml
entity: fan.entity_id
name: Fan Name
type: 'custom:fan-xiaomi'
platform: xiaomi_miio_airpurifier
```
| Card attribute          | Default                | Description                                     |
|-------------------------|------------------------|-------------------------------------------------|
| `entity_id`             |      n\a               | Mandatory: Specify Xiaomi miio fan entity_id               |
| `name`                  |      n\a               | Optional: Fan name to be show for on card                 |
| `type`                  | `custom:fan-xiaomi`    | Mandatory: card type specification               |
| `disable_animation`     | `False`                | Optional: Flag that defines whether to disable fan image  |
| `disable_immediate_UI`  | `False`                | Optional: Flag that defines whether to disable immediate UI changes. In this case, UI is changed only when entity really changes the state.  |
| `use_standard_speeds`  | `False`                | Optional: Use low/medium/high speeds instead of Level 1-3/4 for fans. This can be enabled, if fan is not yet properly supported by this card. |
| `force_sleep_mode_support`  | `False`                | Optional: Enables display of Sleep button in UI, which sets speed to 1% |
| `platform`              | `xiaomi_miio_fan`      | Optional: For [Xiaomi Mi Air Purifier & Xiaomi Mi Air Humidifier Integration](https://github.com/syssi/xiaomi_airpurifier) you must specify `xiaomi_miio_airpurifier`, if [Xiaomi Mi Smart Pedestal Fan Integration](https://github.com/syssi/xiaomi_fan) is used then can specify `xiaomi_miio_fan` or can ommit it. |

## Preview
![](preview.gif)

## Credits
[fineemb](https://github.com/fineemb) (Original author)

[shaonianzhentan](https://github.com/shaonianzhentan/)

[花神](https://github.com/yaming116)
