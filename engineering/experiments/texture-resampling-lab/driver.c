/* Original bounded fixture driver. The separately supplied resizer is not vendored. */
#include <stdio.h>
#include <stdint.h>
#define STBIR_NO_SIMD
#define STB_IMAGE_RESIZE_IMPLEMENTATION
#include "stb_image_resize2.h"
#include "cases.h"
int main(void) {
    for (unsigned i = 0; i < sizeof(cases) / sizeof(cases[0]); ++i) {
        Case *c = &cases[i];
        uint8_t input8[8] = {0}, output8[4] = {0};
        float inputf[8] = {0}, outputf[4] = {0};
        for (int j = 0; j < 2 * c->channels; ++j) {
            input8[j] = (uint8_t)c->values[j]; inputf[j] = (float)c->values[j];
        }
        int floating = c->type == STBIR_TYPE_FLOAT;
        void *out = floating ? (void *)outputf : (void *)output8;
        const void *in = floating ? (const void *)inputf : (const void *)input8;
        void *result = stbir_resize(in, 2, 1, 0, out, 1, 1, 0, c->layout, c->type,
                                    STBIR_EDGE_CLAMP, STBIR_FILTER_BOX);
        if (!result) { fprintf(stderr, "resize failed: %s\n", c->id); return 1; }
        printf("{\"id\":\"%s\",\"output\":[", c->id);
        for (int j = 0; j < c->channels; ++j) {
            if (j) putchar(',');
            if (floating) printf("%.9g", (double)outputf[j]);
            else printf("%u", (unsigned)output8[j]);
        }
        puts("]}");
    }
    return 0;
}
