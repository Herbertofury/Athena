# The web: HTML, CSS, JavaScript and HTTP

Separate structure, presentation, behavior and transport.

## Learn

HTML expresses document structure and semantics. CSS controls presentation. JavaScript adds behavior. Native controls, labels and meaningful headings support keyboard users and assistive technology.

HTTP requests carry methods, paths, headers and bodies; responses carry status and content. A 200 response is not proof that a business operation was correct. Validate data and handle loading, empty, failed and retry states.

Never insert untrusted content as executable HTML. Use text nodes or safe templating, validate URLs, and treat browser storage as untrusted input. Client-side hiding is not authorization.

## Worked example

A search result title supplied by an external API should be rendered as text. Interpolating it directly into innerHTML can create script injection.

## Practice safely

1. Build a labeled form with a submit button.
2. Validate one field and announce errors accessibly.
3. Render a string containing HTML characters as plain text.
4. Test keyboard navigation and a narrow viewport.

## Check your understanding

What is the safer default for displaying untrusted text?

- Assign it to innerHTML
- Use textContent or an escaping template
- Evaluate it as JavaScript
- Put it into an event-handler attribute

<details><summary>Answer and explanation</summary>

Use textContent or an escaping template. Text rendering prevents the string from being interpreted as markup or code.

</details>

## Further study

- https://developer.mozilla.org/en-US/docs/Learn_web_development
- https://www.w3.org/WAI/tutorials/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

