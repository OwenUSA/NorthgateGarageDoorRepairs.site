# docs/divergence.md — ranked divergence table

Generated 2026-09-02T07:04:50.803Z by `src/diff.mjs`.
Rewritten each convergence loop. Ranked worst-first, normalized against each row's own threshold.

Rows: 83 · FAIL: 22 · PASS: 41 · BLOCKED: 0

## Top 10

route | section | bp | class | metric | value | threshold | status | advisory
------|---------|----|-------|--------|-------|-----------|--------|---------
/services | (page) | 390 | PAGE | height delta % | 77.92 | 5 | FAIL | -
/about | (page) | 768 | PAGE | height delta % | 73.51 | 5 | FAIL | -
/about | (page) | 1440 | PAGE | height delta % | 71.79 | 5 | FAIL | -
/services | (page) | 768 | PAGE | height delta % | 70.26 | 5 | FAIL | -
/privacy | (page) | 768 | PAGE | height delta % | 68.71 | 5 | FAIL | -
/services | (page) | 1440 | PAGE | height delta % | 68.52 | 5 | FAIL | -
/about | (page) | 390 | PAGE | height delta % | 67.43 | 5 | FAIL | -
/privacy | (page) | 1440 | PAGE | height delta % | 66.91 | 5 | FAIL | -
/privacy | (page) | 390 | PAGE | height delta % | 66.17 | 5 | FAIL | -
/contact | (page) | 768 | PAGE | height delta % | 50.29 | 5 | FAIL | -

## Full table

route | section | bp | class | metric | value | threshold | status | advisory
------|---------|----|-------|--------|-------|-----------|--------|---------
/services | (page) | 390 | PAGE | height delta % | 77.92 | 5 | FAIL | -
/about | (page) | 768 | PAGE | height delta % | 73.51 | 5 | FAIL | -
/about | (page) | 1440 | PAGE | height delta % | 71.79 | 5 | FAIL | -
/services | (page) | 768 | PAGE | height delta % | 70.26 | 5 | FAIL | -
/privacy | (page) | 768 | PAGE | height delta % | 68.71 | 5 | FAIL | -
/services | (page) | 1440 | PAGE | height delta % | 68.52 | 5 | FAIL | -
/about | (page) | 390 | PAGE | height delta % | 67.43 | 5 | FAIL | -
/privacy | (page) | 1440 | PAGE | height delta % | 66.91 | 5 | FAIL | -
/privacy | (page) | 390 | PAGE | height delta % | 66.17 | 5 | FAIL | -
/contact | (page) | 768 | PAGE | height delta % | 50.29 | 5 | FAIL | -
/contact | (page) | 390 | PAGE | height delta % | 50.05 | 5 | FAIL | -
/ | (page) | 768 | PAGE | height delta % | 45.24 | 5 | FAIL | -
/ | (page) | 1440 | PAGE | height delta % | 38.67 | 5 | FAIL | -
/contact | (page) | 1440 | PAGE | height delta % | 36.09 | 5 | FAIL | -
/ | (page) | 390 | PAGE | height delta % | 33.09 | 5 | FAIL | -
/contact | s02 | 1440 | ADAPTED | structural deviation % | 18.17 | 5 | FAIL | advisory: innerCols ref=0 ours=2 (100%), innerRows ref=0 ours=3 (100%), innerCount ref=0 ours=3 (100%)
/contact | s02 | 768 | ADAPTED | structural deviation % | 15.6 | 5 | FAIL | advisory: innerCols ref=0 ours=2 (100%), innerRows ref=0 ours=3 (100%), innerCount ref=0 ours=3 (100%)
/contact | s02 | 390 | ADAPTED | structural deviation % | 14.92 | 5 | FAIL | advisory: innerCols ref=0 ours=2 (100%), innerRows ref=0 ours=3 (100%), innerCount ref=0 ours=3 (100%)
/services | s03 | 768 | ADAPTED | structural deviation % | 5.29 | 5 | FAIL | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=3 ours=2 (33.33%), innerCount ref=4 ours=3 (25%), position ref=relative ours=static (100%)
/services | s03 | 1440 | ADAPTED | structural deviation % | 5.27 | 5 | FAIL | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=3 ours=2 (33.33%), innerCount ref=4 ours=3 (25%), position ref=relative ours=static (100%)
/contact | s04 | 390 | ADAPTED | structural deviation % | 5.26 | 5 | FAIL | advisory: innerRows ref=2 ours=3 (33.33%), innerCount ref=3 ours=4 (25%), position ref=relative ours=static (100%)
/contact | s03 | 1440 | ADAPTED | structural deviation % | 5.05 | 5 | FAIL | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=1 ours=4 (75%), innerCount ref=2 ours=4 (50%)
/about | s01 | 768 | ADAPTED | structural deviation % | 4.86 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=3 ours=1 (66.67%), innerCount ref=4 ours=2 (50%), position ref=relative ours=static (100%)
/about | s01 | 390 | ADAPTED | structural deviation % | 4.65 | 5 | PASS | advisory: innerRows ref=3 ours=1 (66.67%), innerCount ref=4 ours=2 (50%), position ref=relative ours=static (100%)
/contact | s04 | 768 | ADAPTED | structural deviation % | 4.62 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=2 ours=3 (33.33%), innerCount ref=3 ours=4 (25%), position ref=relative ours=static (100%)
/about | s01 | 1440 | ADAPTED | structural deviation % | 4.55 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=3 ours=1 (66.67%), innerCount ref=4 ours=2 (50%), position ref=relative ours=static (100%)
/services | s01 | 1440 | ADAPTED | structural deviation % | 4.47 | 5 | PASS | advisory: innerCols ref=0 ours=2 (100%), innerRows ref=0 ours=3 (100%), innerCount ref=0 ours=3 (100%)
/contact | s04 | 1440 | ADAPTED | structural deviation % | 3.71 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), innerRows ref=2 ours=3 (33.33%), innerCount ref=3 ours=4 (25%), position ref=relative ours=static (100%)
/ | s01 | 390 | ADAPTED | structural deviation % | 3.45 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%)
/contact | s03 | 390 | ADAPTED | structural deviation % | 3.42 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=1 ours=4 (75%), innerCount ref=2 ours=4 (50%)
/services | s03 | 390 | ADAPTED | structural deviation % | 3.37 | 5 | PASS | advisory: innerRows ref=3 ours=2 (33.33%), innerCount ref=4 ours=3 (25%), position ref=relative ours=static (100%)
/ | s04-top-quality-roofing | 768 | ADAPTED | structural deviation % | 3.18 | 5 | PASS | advisory: innerRows ref=3 ours=4 (25%), innerCount ref=4 ours=5 (20%)
/ | s01 | 768 | ADAPTED | structural deviation % | 3.14 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%)
/ | s02-professional-roofing-in-georgi | 768 | ADAPTED | structural deviation % | 3.1 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=1 (50%), innerCount ref=3 ours=2 (33.33%)
/contact | s03 | 768 | ADAPTED | structural deviation % | 3.04 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=1 ours=4 (75%), innerCount ref=2 ours=4 (50%)
/ | s00-header-one | 390 | ADAPTED | structural deviation % | 2.78 | 5 | PASS | advisory: innerCols ref=1 ours=4 (75%), innerRows ref=2 ours=3 (33.33%), innerCount ref=2 ours=5 (60%), position ref=sticky ours=relative (100%)
/ | s02-professional-roofing-in-georgi | 390 | ADAPTED | structural deviation % | 2.68 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=1 (50%), innerCount ref=3 ours=2 (33.33%)
/services | s01 | 768 | ADAPTED | structural deviation % | 2.67 | 5 | PASS | advisory: innerCols ref=0 ours=2 (100%), innerRows ref=0 ours=3 (100%), innerCount ref=0 ours=3 (100%)
/ | s00-header-one | 768 | ADAPTED | structural deviation % | 2.46 | 5 | PASS | advisory: innerCols ref=2 ours=5 (60%), innerRows ref=2 ours=4 (50%), innerCount ref=2 ours=6 (66.67%), position ref=sticky ours=relative (100%)
/contact | s01-post-217-fill-out-the-form | 1440 | ADAPTED | structural deviation % | 2.45 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=4 (50%), innerCount ref=3 ours=4 (25%)
/ | s01 | 1440 | ADAPTED | structural deviation % | 2.36 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%)
/ | s02-professional-roofing-in-georgi | 1440 | ADAPTED | structural deviation % | 2.26 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=1 (50%), innerCount ref=3 ours=2 (33.33%)
/ | s05-the-hardest-working-roofing-co | 768 | ADAPTED | structural deviation % | 2.18 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), position ref=relative ours=static (100%)
/ | s04-top-quality-roofing | 390 | ADAPTED | structural deviation % | 2.03 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=3 ours=4 (25%), innerCount ref=4 ours=5 (20%)
/ | s04-top-quality-roofing | 1440 | ADAPTED | structural deviation % | 2.03 | 5 | PASS | advisory: innerRows ref=3 ours=4 (25%), innerCount ref=4 ours=5 (20%)
/ | s00-header-one | 1440 | ADAPTED | structural deviation % | 1.7 | 5 | PASS | advisory: innerCols ref=1 ours=6 (83.33%), innerRows ref=1 ours=4 (75%), innerCount ref=2 ours=6 (66.67%)
/services | s01 | 390 | ADAPTED | structural deviation % | 1.64 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=1 ours=3 (66.67%), innerCount ref=1 ours=3 (66.67%)
/ | s05-the-hardest-working-roofing-co | 390 | ADAPTED | structural deviation % | 1.52 | 5 | PASS | advisory: position ref=relative ours=static (100%)
/ | s05-the-hardest-working-roofing-co | 1440 | ADAPTED | structural deviation % | 1.51 | 5 | PASS | advisory: innerCols ref=3 ours=2 (33.33%), position ref=relative ours=static (100%)
/contact | s01-post-217-fill-out-the-form | 768 | ADAPTED | structural deviation % | 1.44 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=4 (50%), innerCount ref=3 ours=4 (25%)
/contact | s01-post-217-fill-out-the-form | 390 | ADAPTED | structural deviation % | 1.4 | 5 | PASS | advisory: innerCols ref=1 ours=2 (50%), innerRows ref=2 ours=4 (50%), innerCount ref=3 ours=4 (25%)
/ | s03 | 1440 | DELETED | no counterpart in build | null | - | UNPAIRED | -
/ | s06 | 1440 | DELETED | no counterpart in build | null | - | UNPAIRED | -
/ | process | 1440 | NOVEL | token violations | 0 | 0 | PASS | -
/ | map | 1440 | NOVEL | token violations | 0 | 0 | PASS | -
/ | footer | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/about | s00-header-one | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/about | s00-header-one | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/about | s00-header-one | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/about | header | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/about | footer | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/services | s00-header-one | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | s02 | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | s00-header-one | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | s02 | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | s00-header-one | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | s02 | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/services | header | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/services | footer | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/contact | s00-header-one | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/contact | s00-header-one | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/contact | s00-header-one | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/contact | header | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/contact | footer | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/privacy | s00-header-one | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | s01 | 390 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | s00-header-one | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | s01 | 768 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | s00-header-one | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | s01 | 1440 | FIDELITY | no counterpart in build | null | - | UNPAIRED | -
/privacy | header | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
/privacy | policy-body | 1440 | NOVEL | token violations | 0 | 0 | PASS | -
/privacy | footer | 1440 | ADAPTED | token violations (no top-level ref band; sub-row of a builder parent) | 0 | 0 | PASS | -
