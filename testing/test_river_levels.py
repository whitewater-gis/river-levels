"""
This is a stubbed out test file designed to be used with PyTest, but can 
easily be modified to support any testing framework.
"""

from pathlib import Path

import pandas as pd

# get paths to useful resources - notably where the src directory is
self_pth = Path(__file__)
dir_test = self_pth.parent
dir_prj = dir_test.parent
dir_src = dir_prj / 'src'

# insert the src directory into the path and import the project package
# sys.path.insert(0, str(dir_src))
import river_levels

usgs_id = '01646500'  # potomac since has both cfs and temp


def test_get_usgs_gauge():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations()
    assert obs.all().all()


def test_get_usgs_gauge_one_day():
    gauge = river_levels.Gauge(gauge_id=usgs_id, source='USGS')
    obs = gauge.get_observations(['cfs', 'height', 'temperature'], period='day')
    assert obs.all().all()


def test_get_usgs_gauge_three_days():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='day', period_count=3)
    assert obs.all().all()


def test_get_usgs_gauge_one_week():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='week')
    assert obs.all().all()


def test_get_usgs_gauge_three_weeks():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='week', period_count=3)
    assert obs.all().all()


def test_get_usgs_gauge_52_months():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='week', period_count=52)
    assert obs.all().all()


def test_get_usgs_gauge_one_month():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='month', period_count=1)
    assert obs.all().all()


def test_get_usgs_gauge_one_year():
    obs = river_levels.Gauge(gauge_id=usgs_id, source='USGS').get_observations(period='year')
    assert obs.all().all()
    assert isinstance(obs, pd.DataFrame)
    assert len(obs.index) > 30000
