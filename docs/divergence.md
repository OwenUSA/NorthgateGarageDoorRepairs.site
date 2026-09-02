# docs/divergence.md — ranked divergence table

Generated 2026-09-02T04:56:01.023Z by `src/diff.mjs`.
Rewritten each convergence loop. Ranked worst-first, normalized against each row's own threshold.

Rows: 75 · FAIL: 51 · PASS: 0 · BLOCKED: 1

## Top 10

route | section | bp | class | metric | value | threshold | status | advisory
------|---------|----|-------|--------|-------|-----------|--------|---------
/services | (page) | 768 | PAGE | height delta % | 90.73 | 5 | FAIL | -
/services | (page) | 1440 | PAGE | height delta % | 90.15 | 5 | FAIL | -
/ | (page) | 768 | PAGE | height delta % | 89.84 | 5 | FAIL | -
/ | (page) | 1440 | PAGE | height delta % | 89.06 | 5 | FAIL | -
/about | (page) | 768 | PAGE | height delta % | 85.49 | 5 | FAIL | -
/contact | (page) | 768 | PAGE | height delta % | 84.5 | 5 | FAIL | -
/about | (page) | 1440 | PAGE | height delta % | 83.93 | 5 | FAIL | -
/privacy | (page) | 768 | PAGE | height delta % | 83.76 | 5 | FAIL | -
/privacy | (page) | 1440 | PAGE | height delta % | 82.58 | 5 | FAIL | -
/services | (page) | 390 | PAGE | height delta % | 82.25 | 5 | FAIL | -

## Full table

route | section | bp | class | metric | value | threshold | status | advisory
------|---------|----|-------|--------|-------|-----------|--------|---------
/services | (page) | 768 | PAGE | height delta % | 90.73 | 5 | FAIL | -
/services | (page) | 1440 | PAGE | height delta % | 90.15 | 5 | FAIL | -
/ | (page) | 768 | PAGE | height delta % | 89.84 | 5 | FAIL | -
/ | (page) | 1440 | PAGE | height delta % | 89.06 | 5 | FAIL | -
/about | (page) | 768 | PAGE | height delta % | 85.49 | 5 | FAIL | -
/contact | (page) | 768 | PAGE | height delta % | 84.5 | 5 | FAIL | -
/about | (page) | 1440 | PAGE | height delta % | 83.93 | 5 | FAIL | -
/privacy | (page) | 768 | PAGE | height delta % | 83.76 | 5 | FAIL | -
/privacy | (page) | 1440 | PAGE | height delta % | 82.58 | 5 | FAIL | -
/services | (page) | 390 | PAGE | height delta % | 82.25 | 5 | FAIL | -
/contact | (page) | 1440 | PAGE | height delta % | 80.97 | 5 | FAIL | -
/ | (page) | 390 | PAGE | height delta % | 79.69 | 5 | FAIL | -
/privacy | (page) | 390 | PAGE | height delta % | 70.44 | 5 | FAIL | -
/about | (page) | 390 | PAGE | height delta % | 70.06 | 5 | FAIL | -
/contact | (page) | 390 | PAGE | height delta % | 64.96 | 5 | FAIL | -
/ | s01 | 390 | ADAPTED | structural deviation % | 32.92 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%)
/ | s01 | 1440 | ADAPTED | structural deviation % | 30.88 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%)
/ | s01 | 768 | ADAPTED | structural deviation % | 30.38 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%)
/about | s01 | 390 | ADAPTED | structural deviation % | 28.63 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=3 ours=0 (100%), innerCount ref=4 ours=0 (100%), position ref=relative ours=static (100%)
/about | s01 | 1440 | ADAPTED | structural deviation % | 26.55 | 5 | FAIL | advisory: innerCols ref=3 ours=0 (100%), innerRows ref=3 ours=0 (100%), innerCount ref=4 ours=0 (100%), position ref=relative ours=static (100%)
/about | s01 | 768 | ADAPTED | structural deviation % | 26.1 | 5 | FAIL | advisory: innerCols ref=3 ours=0 (100%), innerRows ref=3 ours=0 (100%), innerCount ref=4 ours=0 (100%), position ref=relative ours=static (100%)
/contact | s02 | 1440 | ADAPTED | structural deviation % | 24.61 | 5 | FAIL | advisory: none diverge
/contact | s02 | 390 | ADAPTED | structural deviation % | 24.44 | 5 | FAIL | advisory: none diverge
/ | s02-professional-roofing-in-georgi | 1440 | ADAPTED | structural deviation % | 22.27 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/contact | s02 | 768 | ADAPTED | structural deviation % | 22.06 | 5 | FAIL | advisory: none diverge
/contact | s01-post-217-fill-out-the-form | 1440 | ADAPTED | structural deviation % | 20.27 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/contact | s01-post-217-fill-out-the-form | 390 | ADAPTED | structural deviation % | 20.03 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/ | s00-header-one | 390 | ADAPTED | structural deviation % | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/ | s02-professional-roofing-in-georgi | 390 | ADAPTED | structural deviation % | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/about | s00-header-one | 390 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/services | s00-header-one | 390 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/contact | s00-header-one | 390 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/privacy | s00-header-one | 390 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 19.98 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/ | s00-header-one | 1440 | ADAPTED | structural deviation % | 17.92 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=relative ours=static (100%)
/about | s00-header-one | 1440 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.92 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=relative ours=static (100%)
/services | s00-header-one | 1440 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.92 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=relative ours=static (100%)
/privacy | s00-header-one | 1440 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.92 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=relative ours=static (100%)
/contact | s01-post-217-fill-out-the-form | 768 | ADAPTED | structural deviation % | 17.65 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/ | s00-header-one | 768 | ADAPTED | structural deviation % | 17.48 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/ | s02-professional-roofing-in-georgi | 768 | ADAPTED | structural deviation % | 17.48 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=3 ours=0 (100%)
/about | s00-header-one | 768 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.48 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/services | s00-header-one | 768 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.48 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/contact | s00-header-one | 768 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.48 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/privacy | s00-header-one | 768 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.48 | 5 | FAIL | advisory: innerCols ref=2 ours=0 (100%), innerRows ref=2 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=sticky ours=static (100%)
/contact | s00-header-one | 1440 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 17.3 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=2 ours=0 (100%), position ref=relative ours=static (100%)
/services | s02 | 390 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 15.74 | 5 | FAIL | advisory: none diverge
/services | s02 | 1440 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 15.63 | 5 | FAIL | advisory: none diverge
/services | s01 | 390 | ADAPTED | structural deviation % | 15.41 | 5 | FAIL | advisory: innerCols ref=1 ours=0 (100%), innerRows ref=1 ours=0 (100%), innerCount ref=1 ours=0 (100%)
/services | s01 | 1440 | ADAPTED | structural deviation % | 14.93 | 5 | FAIL | advisory: none diverge
/services | s02 | 768 | FIDELITY | structural deviation % (fidelityMode=structural, colour excluded) | 13.37 | 5 | FAIL | advisory: none diverge
/services | s01 | 768 | ADAPTED | structural deviation % | 12.82 | 5 | FAIL | advisory: none diverge
/ | s03 | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s04-top-quality-roofing | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s05-the-hardest-working-roofing-co | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s06 | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s03 | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s04-top-quality-roofing | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s05-the-hardest-working-roofing-co | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s06 | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s03 | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s04-top-quality-roofing | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s05-the-hardest-working-roofing-co | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/ | s06 | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/about | s00 | 1440 | UNDECLARED | not in the contract | null | - | REPORTED | -
/services | s03 | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/services | s03 | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/services | s03 | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s03 | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s04 | 390 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s03 | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s04 | 768 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s03 | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/contact | s04 | 1440 | ADAPTED | no counterpart in build | null | - | UNPAIRED | -
/privacy | s00 | 1440 | UNDECLARED | not in the contract | null | - | REPORTED | -
/privacy | s01 | 1440 | NOVEL | token violations | -1 | 0 | BLOCKED | -
