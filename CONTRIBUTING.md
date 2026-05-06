# Contributing

## Repository Security Settings

GitHub secret scanning must be enabled for this repository. This is a
repository setting, not a code change: in GitHub, open Settings > Code security
and analysis, then enable Secret scanning.

## Frontend Scripts

All frontend dependencies should be bundled through the Vite build. If a future
change adds a third-party `<script src="...">` tag to `frontend/index.html`, the
tag must include `integrity` and `crossorigin="anonymous"` attributes.
