# Planning stage panels — overlay

How the Planning stage works **while this project is in flight**. Live docs remain the truth wherever
this file is silent; where it speaks, it wins for the in-flight work.

Each stage fills its section as it lands — what changed, and how that part works now. A section with
nothing under it means the stage has not landed and live behaviour is unchanged.

## Settings — sale locations and their rates

*Stage A. Not landed.*

Live behaviour stands: `ApplicationSettings` and `planner.Settings` carry one
`defaultCitadelBrokersFee` covering every citadel, and no sales tax rate anywhere. The base broker
rate and its coefficients are inline in `calcBrokersFee` rather than named constants.

## Estimating what it costs to sell

*Stage B. Not landed.*

Live behaviour stands: broker fees are calculated on the Selling stage only, from real market orders —
derived from skill and standings at an NPC station, and taken from `defaultCitadelBrokersFee` at a
citadel. Sales tax is not calculated anywhere.

## The skill catalogue

*Stage C. Not landed.*

Live behaviour stands: `bpSkills.json` carries Broker Relations and the industry skills.

## The pricing basis

*Stage D. Not landed.*

Live behaviour stands: hub and listing are set in the material sources popover, reached from the
market panel's kebab menu, and the resolved pair prints as caption text on each row.

## The material list

*Stage E. Not landed.*

Live behaviour stands: Raw Resources and the market panel each render the material list.

## Cost and return figures

*Stage F. Not landed.*

Live behaviour stands: the totals block renders both pricing models side by side.

## Costing a build before committing

*Stage G. Not landed.*

Live behaviour stands: a speculative job is built when the child-job popover opens and discarded when
it closes.

## Jobs with parent jobs

*Stage H. Not landed.*

Live behaviour stands: a job with parents shows the same revenue and profit figures as a standalone
job.

## The Skills panel

*Stage I. Not landed.*

Live behaviour stands: required skills as a pass/fail list against the selected character.

## Mobile

*Stage J. Not landed.*

Live behaviour stands: the mobile layout stacks every panel at full width.

## Missing live SoT found during this project

Anything discovered that live documentation should have carried but does not, drafted here in the
shape it will take when promoted. Empty until something is found.
