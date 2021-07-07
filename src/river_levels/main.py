from collections import Iterable
from datetime import datetime
from typing import Union


class GaugeVariable(object):

    def __init__(self, name: str, description: str, observations: list):
        self.name = None
        self.description = None
        self.observations = None


class Gauge(object):

    def __init__(self, gauge_id: str, source: str) -> None:
        self.id = gauge_id
        self.source = source
        self.location = None
        self.values = None

    def get_observations(self, flow_type: Union[str, Iterable] = 'cfs', period: str = None, period_count: int = None,
                         start_date: datetime = None, end_date: datetime = None) -> dict:
        """
        Retrieve gauge observation(s). If no temporal parameters are provided, only the most
        current observation is retrieved.

        Args:
            flow_type: Desired flow type to be retrieved, cfs or height. If both, input ['cfs', 'height'].
            period: String of how long to look back into the data to retrieve. Valid values are 'day', 'week', or
                'year'.
            period_count: If providing a period to look back, this is the count of periods to look back. For instance,
                if three days are desired, provide period='week', period_count=3. The default is one(1).
            start_date: If a specific window is desired, retrieve data from this start date. If no end date is provided,
                data will be retrieved all the way to most current data available.
            end_date: If a specific temporal window is desired not to the current date, this provides the end date for
                retrieval.

        Returns:
            Dictionary of observations.
        """
        # provide default if period_count is not provided
        if period is not None and period_count is None:
            period_count = 1

        # validate period parameter if necessary
        if period_count is not None:
            assert period in ['day', 'week', 'year'], f'period parameter must be either "day", "week" or "year", not ' \
                                                      f'{period}'

        # validate datetime combination
        if end_date is not None:
            assert start_date is not None, 'If an end date is provided, a start date must also be provided.'

        self.__getattribute__()