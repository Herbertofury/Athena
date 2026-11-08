# Check security compatibility without claiming an RF survey

Combine client capabilities, minimum security policy and a simple channel comparison while preserving RF uncertainty.

## Learning goals

- Separate SSID identity, authentication requirements and client capability.
- Evaluate a security minimum without downgrading it to make a match.
- Explain what a channel-overlap model cannot say about real RF performance.

## Learn

A wireless connection depends on several independent conditions: a suitable radio link, compatible capabilities, an allowed security method and a working network behind the access point. Seeing an SSID addresses only part of that problem. An SSID identifies a wireless service set, not the strength of its security or the correctness of its VLAN mapping. Record the intended service, client capability and organizational minimum before recommending a network, rather than treating the most visible or strongest-looking signal as automatically appropriate.

WPA2 and WPA3 describe security families with different modes and requirements. Personal and enterprise deployments use different authentication arrangements; an enterprise design can involve 802.1X and an authentication server rather than a shared personal passphrase. WPA3-Personal uses SAE, while protected management frame requirements and transition behavior need careful platform-specific attention. A capability label in a fixture simplifies these details. It cannot prove that credentials, certificate validation, authentication-server policy or the client implementation would satisfy a real deployment's requirements.

Compatibility and acceptability are separate judgments. A client might support a network whose security falls below the required minimum, or a securely configured network might require capabilities absent from that client. Lowering the minimum solely to make the client connect changes the security decision rather than fixing compatibility. The worksheet should preserve both failure types. A defensible recommendation could be to use a different approved device or seek a reviewed design change, without inventing permission to weaken an actual wireless policy.

Radio planning also requires more than selecting a channel number. In 2.4 GHz deployments, commonly used 20 MHz channel plans can reduce overlap by separating appropriate channel choices, subject to local regulations. Channel width, channel availability, transmit power, neighboring networks and physical conditions all matter. A simple frequency-spacing model can highlight potential overlap between selected channels, but it cannot measure signal-to-noise ratio, airtime contention, hidden nodes or the effect of walls and moving users on a real client.

Access points and controllers divide responsibilities according to architecture. Controller-based, autonomous and cloud-managed designs differ in management and forwarding arrangements. Roaming decisions and authentication behavior also depend on clients and infrastructure. The local eligibility list does not create a WLAN, attach a client, verify a controller path or test roaming. Keep the architecture drawing separate from the fixture result, and label every proposed RF observation with the location, channel width and measurement conditions that would make it useful in a later authorized survey.

Run the fixed wireless exercise and preserve why each candidate is eligible or rejected under its contract. In a paper counterfactual, replace the client with one supporting the stronger method while keeping the security minimum unchanged. Separately compare the modeled channel pairs and identify which real measurements remain absent. Never report channel separation as an interference-free guarantee. This exercise does not scan local networks, collect identifiers or contact an access point; it demonstrates bounded compatibility and planning reasoning rather than an operational wireless assessment.

## Worked example

lobby is eligible with no reasons. office is ineligible with unsupported_client_security. guest is ineligible with both unsupported_client_security and below_requested_security. Preserve both guest reasons instead of describing the result solely as a weak signal. lobby/office and office/guest return overlap_in_simplified_plan; lobby/guest returns separated_in_simplified_plan. The assumptions are 2.4 GHz channels 1 through 11 and 20 MHz only, and rf_measurements_available is false. On paper, give the client WPA3 capability while preserving its other capabilities and the minimum security requirement, then reconsider office. Do not infer improved RF conditions from that security change. A separated pair remains a planning result, not measured freedom from interference.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py wireless
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the wireless fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py wireless.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A client capability and minimum-security decision matrix.
- A channel comparison with width assumptions and absent RF measurements.
- A paper client-upgrade counterfactual and an unexecuted survey plan.

## Original check 1

A client cannot meet the approved WLAN security requirement. What is a defensible next step?

A. Silently downgrade the security minimum
B. Consider a compatible approved client while preserving the requirement
C. Assume SSID visibility proves compatibility
D. Disable authentication everywhere

<details><summary>Answer and reasoning</summary>

B. Consider a compatible approved client while preserving the requirement

Compatibility should be resolved without silently changing the security decision; a capability mismatch does not authorize weakening the approved minimum.

</details>

## Original check 2

What can a simple channel-spacing model establish?

A. Measured airtime contention
B. A complete RF site survey
C. A bounded comparison under its stated width assumptions
D. Guaranteed roaming performance

<details><summary>Answer and reasoning</summary>

C. A bounded comparison under its stated width assumptions

Channel arithmetic omits actual RF conditions, neighboring transmitters, client capabilities and deployment behavior that affect measured performance.

</details>

## Original check 3

What does an SSID alone tell you?

A. That certificates are validated
B. That all clients support WPA3
C. That the uplink VLAN is correct
D. The advertised service-set identity, not complete security assurance

<details><summary>Answer and reasoning</summary>

D. The advertised service-set identity, not complete security assurance

A name does not establish authentication, client capability or wired-network configuration.

</details>

## Limits

No WLAN scan, credentials, association, controller configuration or RF measurement occurs. Security labels and channel spacing are simplified; enterprise authentication, regulatory domains, roaming and actual interference remain untested.

## Official references

- https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-14/config-guide/b_wl_17_14_cg/m_wpa3.html
- https://www.cisco.com/en/US/docs/solutions/Enterprise/Mobility/emob30dg/RFDesign.html
