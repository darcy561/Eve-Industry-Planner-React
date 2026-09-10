# Planning stage panels — overlay

How the Planning stage works **while this project is in flight**. Live docs remain the truth wherever
this file is silent; where it speaks, it wins for the in-flight work.

Each stage fills its section as it lands — what changed, and how that part works now. A section with
nothing under it means the stage has not landed and live behaviour is unchanged.

## Settings — sale locations and their rates

*Stage A. Landed — no visible behaviour change.*

The broker fee rates are now `brokerFeeRates` in `defaultValues.jsx` — base, the Broker Relations,
faction and corporation coefficients, and the ISK floor — with the skill type ids beside them as
`marketSkillIDs`. `calcBrokersFee` reads both and holds no literal of its own, so the Selling stage and
anything Planning adds work from one source. The fee it produces is unchanged.

The sales tax rates are named too, as `salesTaxRates`, with Accounting's type id beside Broker
Relations'. Nothing reads them yet — no sales tax is calculated anywhere — but the figures are in the
tree so Stage B does not have to source them. Accounting reduces the base multiplicatively, unlike the
broker fee's subtracted coefficients.

Live behaviour otherwise stands: `ApplicationSettings` and `planner.Settings` carry one
`defaultCitadelBrokersFee` covering every citadel, and no sales tax is charged in any figure the app
shows.

The other half is a reading surface with no consumers yet. `Functions/MarketOrders/saleLocations.js`
answers which citadels can be sold from and normalises a hub or a citadel into one shape carrying its
name, the station whose prices apply, and its broker fee — `null` at a hub, where the rate derives from
the seller. It returns two placeholder citadels: nothing is stored, and no screen reads it yet.

**Storing saved citadels left this project.** The `CustomStructures` lane and everything around it went
to the custom-structure work; see the plan's § Handed to the custom-structure work.

## Estimating what it costs to sell

*Stage B. Landed — no visible behaviour change.*

`Functions/MarketOrders/sellingRates.js` answers what a sale costs, as a rate and an amount for each
charge: `brokerFeeRate` / `brokerFeeAmount` and `salesTaxRate` / `salesTaxAmount`. The fee branches on
the sale location — derived from Broker Relations and standings at a station, taken as given at a
citadel — while the tax takes no location at all, since it has no station or structure component.
Signed out, both fall back to the base rate with no reduction.

`calcBrokersFee` is now a call to those two functions plus the location branch a real order needs, so
the Selling stage and anything Planning adds work from one formula. The fee it produces is unchanged.

Nothing calls the tax half yet: sales tax still appears in no figure the app shows. It exists in this
shape so the Selling stage can charge it against a real sale without the Planning stage having built a
version shaped only for itself.

## The skill catalogue

*Stage C. Landed.*

`bpSkills.json` carries Accounting (16622) alongside Broker Relations and the industry skills, so a
character's Accounting level resolves through `getSkills` like any other. Nothing reads it yet — no
sales tax is calculated — but a skill absent from this file reads as untrained rather than as missing,
which is why it goes in before the figure that depends on it.

## The pricing basis

*Stage D. Landed — no visible behaviour change.*

Live behaviour stands on screen: hub and listing are still set in the material sources popover, reached
from the market panel's kebab menu, and the resolved pair still prints as caption text on each row.

What has landed is the replacement, unmounted. `Styled Components/Select/pricingBasis.jsx` is a header
control that offers the four modes each with its own total and how far that sits from the mode in
effect, so a percentile stops reading as jargon. `Functions/MarketData/materialPricing.js` computes
those totals — honouring a row's own override on every candidate, since an override outranks the panel
default — and answers whether a row is an estimate, part paid, or paid in full.

It is unmounted because the headers it belongs in are Stage E and F's panels. Mounting it in today's
market panel would put it on the old `ContentPanel` shell, in a panel those stages delete.

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
