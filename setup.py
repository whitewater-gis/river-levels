from setuptools import find_packages, setup

with open('README.md', 'r') as readme:
    long_description = readme.read()

setup(
    name='river_levels',
    package_dir={"": "src"},
    packages=find_packages('src'),
    version='0.1.0-dev1',
    description='Tooling for checking river levels.',
    long_description=long_description,
    author='Joel McCune (https://github.com/knu2xs)',
    license='Apache 2.0',
)
