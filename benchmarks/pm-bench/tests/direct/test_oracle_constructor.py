"""Direct test: isolate why IntelligentOracle fails on Studio with full args."""
import json


# Real Wunderground market args from gate1-pass.jsonl
WARMUP_ARGS = {
    'prediction_market_id': '2161570',
    'title': 'Will the lowest temperature in London be 6°C on May 7?',
    'description': (
        'This market will resolve to the temperature range that contains '
        'the lowest temperature recorded at the London City Airport Station '
        'in degrees Celsius on 7 May \'26. The resolution source for this '
        'market will be information from Wunderground, specifically the '
        'lowest temperature recorded for all times on this day by the '
        'Forecast for the London City Airport Station once information is '
        'finalized, available here: https://www.wunderground.com/history/'
        'daily/gb/london/EGLC. To toggle between Fahrenheit and Celsius, '
        'click the gear icon next to the search bar and switch the '
        'Temperature setting between °F and °C. This market can not '
        'resolve to "Yes" until all data for this date has been finalized. '
        'The resolution source for this market measures temperatures to '
        'whole degrees Celsius (eg, 9°C). Thus, this is the level of '
        'precision that will be used when resolving the market. Any '
        'revisions to temperatures recorded after data is finalized for '
        'this market\'s timeframe will not be considered for this market\'s '
        'resolution.'
    ),
    'potential_outcomes': ['Yes', 'No'],
    'rules': ['only one rule'],
    'data_source_domains': [],
    'resolution_urls': [
        'https://www.wunderground.com/history/daily/gb/london/EGLC/date/2026-5-7'
    ],
    'earliest_resolution_date': '2026-05-07',
}

CONTRACT = "contracts/intelligent_oracle_local.py"


def test_minimal_args_deploy(direct_vm, direct_deploy, direct_alice):
    """Smoke test: minimal args."""
    direct_vm.sender = direct_alice
    contract = direct_deploy(
        CONTRACT,
        'mid', 'title', 'desc',
        ['Yes', 'No'], ['rule'], [], ['https://x.com/'], '2026-05-07',
    )
    state = contract.get_dict()
    assert state['prediction_market_id'] == 'mid'
    assert state['status'] == 'Active'


def test_warmup_args_deploy(direct_vm, direct_deploy, direct_alice):
    """The exact args that fail on Studio."""
    direct_vm.sender = direct_alice
    a = WARMUP_ARGS
    contract = direct_deploy(
        CONTRACT,
        a['prediction_market_id'],
        a['title'],
        a['description'],
        a['potential_outcomes'],
        a['rules'],
        a['data_source_domains'],
        a['resolution_urls'],
        a['earliest_resolution_date'],
    )
    state = contract.get_dict()
    assert state['prediction_market_id'] == '2161570'
    assert state['status'] == 'Active'
    assert len(state['resolution_urls']) == 1


def test_warmup_args_with_resolve(direct_vm, direct_deploy, direct_alice):
    """The full flow: deploy + resolve with mocked web + LLM."""
    direct_vm.sender = direct_alice
    a = WARMUP_ARGS
    # Mock the webdriver render call to return Wunderground page text
    direct_vm.mock_web(
        r".*wunderground\.com/history/daily/gb/london/EGLC.*",
        {
            "status": 200,
            "body": (
                "London City Airport Station\n"
                "High Temp 57\n"
                "Low Temp 48\n"
                "May 7 2026 hourly observations..."
            ),
        },
    )
    # Mock LLM responses for both per-source and aggregator
    direct_vm.mock_llm(
        r".*",
        json.dumps({
            "valid_source": "true",
            "event_has_occurred": "true",
            "reasoning": "Recorded low 48°F = 9°C; market asks 6°C → No.",
            "outcome": "No",
            "relevant_sources": [a['resolution_urls'][0]],
        }),
    )
    contract = direct_deploy(
        CONTRACT,
        a['prediction_market_id'],
        a['title'],
        a['description'],
        a['potential_outcomes'],
        a['rules'],
        a['data_source_domains'],
        a['resolution_urls'],
        a['earliest_resolution_date'],
    )
    contract.resolve('')
    state = contract.get_dict()
    assert state['status'] == 'Resolved'
    assert state['outcome'] == 'No'
