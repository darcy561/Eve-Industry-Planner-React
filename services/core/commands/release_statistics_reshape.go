package commands

import eipmongo "eve-industry-planner/shared/mongo"

// derivedStatisticsCollections hold nothing that is not computed from the
// archived jobs.
var derivedStatisticsCollections = []string{
	eipmongo.CollectionStatisticsRows,
	eipmongo.CollectionStatisticsTimeline,
	eipmongo.CollectionStatisticsTotals,
}
