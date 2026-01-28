"""Setup configuration for OSSA Python client."""

from setuptools import setup, find_packages

with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='ossa-client',
    version='1.0.0',
    description='Python reference implementation for OSSA API',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='OSSA Community',
    author_email='registry@openstandardagents.org',
    url='https://github.com/openstandardagents/ossa',
    packages=find_packages(),
    install_requires=[
        'requests>=2.31.0',
        'urllib3>=2.0.0',
    ],
    python_requires='>=3.8',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
    ],
    keywords='ossa agents ai sdk',
    project_urls={
        'Documentation': 'https://docs.openstandardagents.org',
        'Source': 'https://github.com/openstandardagents/ossa',
        'Bug Reports': 'https://github.com/openstandardagents/ossa/issues',
    },
)
