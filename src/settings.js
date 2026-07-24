// Reusable style-property blocks for the rich text editor.
// Each content element type (paragraph, headings, quote, code, lists, link)
// reuses the same typography controls, generated with a shared prefix so the
// whole group can be dropped into ww-config `properties` and grouped in the
// side panel via `customStylePropertiesOrder`.

const lengthPx = (min = 0, max = 200) => ({
    type: 'Length',
    options: {
        unitChoices: [
            { value: 'px', label: 'px', min, max },
            { value: 'em', label: 'em', min: 0, max: 10 },
            { value: 'rem', label: 'rem', min: 0, max: 10 },
        ],
        noRange: true,
        useVar: true,
    },
    bindable: true,
    responsive: true,
});

// One typography group for a given element type.
// `prefix` is used both for the property keys (e.g. `h1FontSize`) and the CSS
// variables produced in wwElement.vue (e.g. `--rt-h1-font-size`). Labels are just
// the field name — the group header (customStylePropertiesOrder) already names
// the element type, so repeating it in every row only clutters the panel.
export function typographyGroup(prefix) {
    return {
        [`${prefix}FontFamily`]: {
            label: { en: 'Font', fr: 'Police' },
            type: 'FontFamily',
            section: 'style',
            bindable: true,
            responsive: true,
        },
        [`${prefix}FontSize`]: {
            label: { en: 'Size', fr: 'Taille' },
            section: 'style',
            ...lengthPx(1, 120),
        },
        [`${prefix}FontWeight`]: {
            label: { en: 'Weight', fr: 'Graisse' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: null, label: { en: 'Default', fr: 'Par défaut' } },
                    { value: '300', label: { en: '300 - Light' } },
                    { value: '400', label: { en: '400 - Normal' } },
                    { value: '500', label: { en: '500 - Medium' } },
                    { value: '600', label: { en: '600 - Semi Bold' } },
                    { value: '700', label: { en: '700 - Bold' } },
                    { value: '800', label: { en: '800 - Extra Bold' } },
                ],
            },
            defaultValue: null,
            bindable: true,
            responsive: true,
        },
        [`${prefix}Color`]: {
            label: { en: 'Color', fr: 'Couleur' },
            type: 'Color',
            section: 'style',
            bindable: true,
            responsive: true,
            options: { nullable: true },
        },
        [`${prefix}LineHeight`]: {
            label: { en: 'Line height', fr: 'Interligne' },
            section: 'style',
            ...lengthPx(0, 10),
        },
        [`${prefix}MarginTop`]: {
            label: { en: 'Margin top', fr: 'Marge haut' },
            section: 'style',
            ...lengthPx(0, 120),
        },
        [`${prefix}MarginBottom`]: {
            label: { en: 'Margin bottom', fr: 'Marge bas' },
            section: 'style',
            ...lengthPx(0, 120),
        },
    };
}

// The element types we expose grouped styling for, in display order.
export const CONTENT_TYPES = [
    { prefix: 'paragraph', label: 'Paragraph', selector: 'p' },
    { prefix: 'h1', label: 'Heading 1', selector: 'h1' },
    { prefix: 'h2', label: 'Heading 2', selector: 'h2' },
    { prefix: 'h3', label: 'Heading 3', selector: 'h3' },
    { prefix: 'h4', label: 'Heading 4', selector: 'h4' },
    { prefix: 'h5', label: 'Heading 5', selector: 'h5' },
    { prefix: 'h6', label: 'Heading 6', selector: 'h6' },
    { prefix: 'blockquote', label: 'Quote', selector: 'blockquote' },
    // `extras` are extra property keys appended to this type's side-panel group.
    { prefix: 'code', label: 'Code', selector: 'pre', extras: ['codeBackground'] },
    { prefix: 'list', label: 'Lists', selector: 'ul, ol' },
    { prefix: 'link', label: 'Link', selector: 'a' },
];

// Typography sub-properties (suffixes) that each group defines, used to build
// CSS variables in wwElement.vue.
export const TYPO_FIELDS = [
    { suffix: 'FontFamily', css: 'font-family' },
    { suffix: 'FontSize', css: 'font-size' },
    { suffix: 'FontWeight', css: 'font-weight' },
    { suffix: 'Color', css: 'color' },
    { suffix: 'LineHeight', css: 'line-height' },
    { suffix: 'MarginTop', css: 'margin-top' },
    { suffix: 'MarginBottom', css: 'margin-bottom' },
];
