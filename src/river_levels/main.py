from collections.abc import Iterable
from datetime import datetime
from typing import Union
from warnings import warn

from dateutil.relativedelta import relativedelta
import pandas as pd
import pytz
import requests

__all__ = ['Gauge']


class Gauge(object):

    sources = {
        'USGS': 'USGS Instantaneous Values',
        'WADOE': 'Washington State Department of Ecology'
    }

    def __init__(self, gauge_id: str, source: str) -> None:
        self.id = gauge_id
        self.location = None
        self.values = None

        # validate source and set
        assert source.upper() in self.sources.keys(), f'Please provide a valid source ' \
                                                      f'[{",".join(self.sources.keys())}].'
        self.source = source

    def get_observations(self, metrics: Union[str, Iterable] = 'cfs', period: str = None, period_count: int = None,
                         start_date: datetime = None, end_date: datetime = None, 
                         return_dataframe: bool = True) -> Union[dict, pd.DataFrame]:
        """
        Retrieve gauge observation(s). If no temporal parameters are provided, only the 
        most current observation is retrieved.

        Args:
            gauge_ids: Gauge ID's to be retrieved.
            metrics: Desired metric to be retrieved, cfs (or flow), height or
                temperature. If multiple, input as a list ['cfs', 'height',
                'temperature'].
            period: String of how long to look back into the data to retrieve. Valid 
                values are 'day', 'week' or 'year'.
            period_count: If providing a period to look back, this is the count of 
                periods to look back. For instance, if three days are desired, provide 
                period='week', period_count=3. The default is one(1).
            start_date: If a specific window is desired, retrieve data from this start 
                date. If no end date is provided, data will be retrieved all the way to 
                most current data available.
            end_date: If a specific temporal window is desired not to the current date, 
                this provides the end date for retrieval.
            return_dataframe: If a dataframe is desired to be returned. If False,
                results are returned as a dictionary.
        """
        # provide default if period_count is not provided
        if period is not None and period_count is None:
            period_count = 1

        # validate period parameter if necessary
        if period_count is not None:
            prd_lst = ['day', 'week', 'month', 'year']
            assert period in prd_lst, f'period parameter must be [{",".join(prd_lst)}], not {period}'

        # validate datetime combination
        if end_date is not None:
            assert start_date is not None, 'If an end date is provided, a start date must also be provided.'

        # get the name of the function to direct to
        fn_name = f'_get_observations_{self.source.lower()}'

        # make sure the source is implemented
        assert hasattr(self, fn_name), f'get_observations is not yet implemented for {self.source.upper()}'

        # retrive the function to invoke
        fn_to_call = getattr(self, fn_name)

        # invoke the source function and return the result
        return fn_to_call(metrics, period, period_count, start_date, end_date, return_dataframe)

    def _get_observations_usgs(self, metrics: Union[str, Iterable] = 'cfs', period: str = None,
                               period_count: int = None, start_date: datetime = None, end_date: datetime = None,
                               return_dataframe: bool = True):
        """USGS implementation for get_observations."""

        # url for real time water services
        url = 'https://waterservices.usgs.gov/nwis/iv/'

        # start building payload
        data = {'format': 'json', 'sites': self.id}

        # create list of gauge metric parameters and add to payload
        mtrc_dict = {
            'cfs': '00060',
            'height': '00065',
            'temperature': '00010'
        }

        # if a string provided, convert metrics to list and ensure all lowercase
        metrics = [metrics] if isinstance(metrics, str) else metrics
        metrics = [m.lower() for m in metrics]

        # account for flow being used in lieu of cfs
        metrics = ['cfs' if m == 'flow' else m for m in metrics]

        # look up the metric codes
        mtrc_lst = [mtrc_dict[mtrc] for mtrc in metrics]

        # add metric codes onto payload as comma separated string
        data['parameterCd'] = ','.join(mtrc_lst)

        # create a list of period parameters if provided
        if period:

            # the rest endpoint can handle weeks or days
            if period in ['week', 'day']:
                prd_dict = {
                    'week': 'W',
                    'day': 'D'
                }
                data['period'] = f'P{period_count}{prd_dict[period]}'

            # and we have to handle months or years
            else:

                # get today's datetime
                now = datetime.now().astimezone()

                # subtract the interval of months or years
                if period == 'month':
                    dt_years_ago = (now - relativedelta(months=period_count))
                else:
                    dt_years_ago = (now - relativedelta(years=period_count))

                # zero out the hours and save as start time
                start_date = dt_years_ago.replace(hour=0, minute=0, second=0, microsecond=0)

                # set the end time to now
                end_date = now

        # validate dates and set into parameters if present
        if end_date is not None:
            assert start_date is not None, 'If providing an end_date, you must also provide a start_date.'
            assert isinstance(end_date, datetime), 'end_date must be a Python datetime.datetime object.'
            data['endDT'] = end_date.isoformat()

        if start_date is not None:
            assert isinstance(start_date, datetime), 'start_date must be a Python datetime.datetime object.'
            data['startDT'] = start_date.isoformat()

        # make the request
        res = requests.get(url, params=data)

        # ensure good response
        assert res.status_code == 200

        # unpack the payload - it's a mess of redundant nested keys
        rjson = res.json()

        # invert the metric dict for looking up metric types
        mtrc_cd_dict = {mtrc_dict[k]: k for k in mtrc_dict}

        # create a dict to populate
        obs_dict = {}

        # pull out the useful stuff
        for ts in rjson['value']['timeSeries']:
            variable_name = mtrc_cd_dict[ts['variable']['variableCode'][0]['value']]
            obs_raw_lst = ts['values'][0]['value']
            obs_dict[variable_name] = {datetime.fromisoformat(obs['dateTime']): obs['value'] for obs in obs_raw_lst}

        # create an variable to populate with outputs
        ret_val = {}

        # iterate the observation types
        for metric in obs_dict.keys():

            # ensure data is returned for the chosen metric
            if len(obs_dict[metric]):

                # if no other metric has populated the output yet, create a dictionary using the timestamps as the keys
                if len(ret_val) == 0:

                    # create a dict with timestamp as key and a nested dict with the label and value
                    ret_val = {k: {metric: float(v) if v.replace('.', '').isnumeric() else v}
                               for k, v in obs_dict[metric].items()}

                # for subsequent metrics, tack onto existing dict
                else:
                    for key, val in obs_dict[metric].items():
                        ret_val[key][metric] = val

            # warn if no data for metric
            else:
                warn(f'No data is available for the requested metric, {metric}.')

        # check requested metrics against returned metrics
        ret_keys = [val for val in list(next(iter(ret_val.items()))[1].keys())]
        not_ret_lst = [mtrc for mtrc in metrics if mtrc not in ret_keys]
        if len(not_ret_lst):
            warn(f'Although requested, {", ".join(not_ret_lst)} does not appear to be available at this site.')

        # if a dataframe is desired, create it
        if return_dataframe:
            ret_val = pd.DataFrame.from_dict(ret_val, orient='index')

            # get the applicable timezone
            dt_dict = {
                'PST': 'US/Pacific',
                'AKST': 'US/Alaska',
                'EST': 'US/Eastern',
                'MST': 'US/Mountain',
                'CST': 'US/Central'
            }
            tz_nm = dt_dict[ts['sourceInfo']['timeZoneInfo']['defaultTimeZone']['zoneAbbreviation']]

            ret_val.index = [dt.astimezone(pytz.timezone(tz_nm)) for dt in ret_val.index]

        return ret_val

    def get_rolling_mean(self, metric: str = 'cfs', min: Union[int, float] = None, max: Union[int, float] = None,
                         period_count: int = 5, period: str = 'year', start_date: datetime = None,
                         end_date: datetime = None, rolling_window: str = '28D',
                         apply_smoothing: bool = True) -> pd.DataFrame:
        """
        Get a mean timeseries of flow observations for one year.
        Args:
            min:
            max:
            period_count:
            period:
            start_date:
            end_date:
            rolling_window:
            apply_smoothing:

        Returns:
            Pandas DataFrame of mean, plus one standard deviation and minus one standard deviation flow curves.

        """

        # retrive observations
        obs = self.get_observations(period=period, period_count=period_count, metrics=metric, start_date=start_date,
                                    end_date=end_date)

        # standardize the dataframe
        obs.rename(columns={metric: 'flow'}, inplace=True)


        # calculate the mean and standard deviation over a rolling window
        mean_df = obs['flow'].rolling(rolling_window).mean()
        std_df = obs['flow'].rolling(rolling_window).std()

        # combine the means and standard deviations
        obs_join = obs.join(mean_df, rsuffix='_mean').join(std_df, rsuffix='_std')

        # calculate a curve one standard deviation above and below the mean
        obs_join[f'flow_plus_std'] = obs_join[f'flow_mean'] + obs_join[f'flow_std']
        obs_join[f'flow_less_std'] = obs_join[f'flow_mean'] - obs_join[f'flow_std']

        # drop out leap year days
        obs_nrml = obs_join[~((obs_join.index.month == 2) & (obs_join.index.day == 29))].copy()
        obs_nrml['timestamp'] = [val.replace(year=1973) for val in obs_nrml.index]

        # tack on values for the preceeding and trailing months to ensure the curve covers an entire year
        lead_obs = obs_nrml[obs_nrml.index.month == 12].copy()
        lead_obs['timestamp'] = [val.replace(year=1972) for val in lead_obs.index]
        lag_obs = obs_nrml[obs_nrml.index.month == 1].copy()
        lag_obs['timestamp'] = [val.replace(year=1973) for val in lag_obs.index]
        obs_nrml = pd.concat([obs_nrml, lead_obs, lag_obs])

        # create an average curve table for one year
        mean_cols = [f'flow_mean', f'flow_plus_std', f'flow_less_std', 'timestamp']
        mean_df = obs_nrml[mean_cols].groupby('timestamp').mean()

        # if min and max range flows are provided, add them
        if min is not None:
            mean_df[f'flow_bott'] = min
        if max is not None:
            mean_df[f'flow_top'] = max

        # consolidate into days...because nobody wants needs every 15 minutes for an entire year
        mean_df = mean_df.groupby(pd.Grouper(freq='D')).mean()

        # if smoothing the curve (a VERY good idea), do it
        if apply_smoothing:
            mean_df = mean_df.rolling(window=5).mean()

        mean_df = mean_df[mean_df.index.year == 1973].copy()

        return mean_df
