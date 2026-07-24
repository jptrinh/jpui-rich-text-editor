import { typographyGroup, CONTENT_TYPES } from './src/settings';

// Build one typography group of style properties per content element type.
const contentStyleProperties = CONTENT_TYPES.reduce(
    (acc, { prefix, label }) => ({ ...acc, ...typographyGroup(prefix, label) }),
    {}
);

// Build the collapsible side-panel groups for those style properties.
const contentStyleGroups = CONTENT_TYPES.map(({ prefix, label, extras = [] }) => ({
    label,
    isCollapsible: true,
    properties: [
        `${prefix}FontFamily`,
        `${prefix}FontSize`,
        `${prefix}FontWeight`,
        `${prefix}Color`,
        `${prefix}LineHeight`,
        `${prefix}MarginTop`,
        `${prefix}MarginBottom`,
        ...extras,
    ],
}));

const offsetLength = {
    type: 'Length',
    options: {
        unitChoices: [{ value: 'px', label: 'px', min: -500, max: 500 }],
        noRange: true,
    },
    bindable: true,
    responsive: true,
};

export default {
    editor: {
        label: { en: 'Rich Text Editor', fr: 'Éditeur de texte riche' },
        icon: 'text',
        customStylePropertiesOrder: [
            {
                label: 'Editor box',
                isCollapsible: true,
                properties: [
                    'editorFontFamily',
                    'editorFontSize',
                    'editorColor',
                    'editorBackground',
                    'editorPadding',
                    'editorMinHeight',
                    'editorBorder',
                    'editorBorderRadius',
                    'placeholderColor',
                ],
            },
            {
                label: 'Selection menu',
                isCollapsible: true,
                properties: [
                    'menuVerticalPosition',
                    'menuHorizontalPosition',
                    'menuAutoFlip',
                    'menuBackground',
                    'menuBorder',
                    'menuBorderRadius',
                    'menuPadding',
                    'menuGap',
                    'menuShadow',
                    'menuOffsetX',
                    'menuOffsetY',
                ],
            },
            ...contentStyleGroups,
        ],
        customSettingsPropertiesOrder: [
            'initialValue',
            'placeholder',
            'editable',
            'readonly',
            'autofocus',
            'forceOpenMenu',
            'debounce',
            'debounceDelay',
        ],
    },
    properties: {
        // ---- Settings ----
        initialValue: {
            label: { en: 'Initial value (HTML)', fr: 'Valeur initiale (HTML)' },
            type: 'Textarea',
            section: 'settings',
            defaultValue: '<p>Edit me…</p>',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'HTML string used as the initial content of the editor.',
            },
            /* wwEditor:end */
        },
        placeholder: {
            label: { en: 'Placeholder' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'Start writing…',
            bindable: true,
        },
        editable: {
            label: { en: 'Editable' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Allow the user to edit the content.' },
            /* wwEditor:end */
        },
        readonly: {
            label: { en: 'Read only' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Force read-only, overrides Editable.' },
            /* wwEditor:end */
        },
        autofocus: {
            label: { en: 'Autofocus' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
        },
        forceOpenMenu: {
            label: { en: 'Force open floating toolbar' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'boolean',
                tooltip: 'Editor mode only: keep the floating toolbar open so you can drop and arrange buttons. Has no effect at runtime.',
            },
            propertyHelp: {
                tooltip: 'When ON, the floating selection menu stays open in the WeWeb editor so you can drop elements into it. When OFF, it only appears on text selection, like at runtime.',
            },
            /* wwEditor:end */
        },
        debounce: {
            label: { en: 'Debounce change event' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
        },
        debounceDelay: {
            label: { en: 'Debounce delay' },
            type: 'Length',
            section: 'settings',
            options: {
                unitChoices: [{ value: 'ms', label: 'ms', min: 1, max: 5000 }],
                noRange: true,
            },
            defaultValue: '400ms',
            hidden: content => !content?.debounce,
        },

        // ---- Selection menu dropzone (hidden array) ----
        toolbarContent: {
            hidden: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Elements dropped into the floating selection menu.',
            },
            /* wwEditor:end */
        },

        // ---- Editor box style ----
        editorFontFamily: {
            label: { en: 'Base font' },
            type: 'FontFamily',
            section: 'style',
            bindable: true,
            responsive: true,
        },
        editorFontSize: {
            label: { en: 'Base font size' },
            type: 'Length',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 8, max: 72 }], noRange: true },
            defaultValue: '16px',
            bindable: true,
            responsive: true,
        },
        editorColor: {
            label: { en: 'Base text color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#1f2937',
            bindable: true,
            responsive: true,
        },
        editorBackground: {
            label: { en: 'Background' },
            type: 'Color',
            section: 'style',
            defaultValue: '#ffffff',
            bindable: true,
            responsive: true,
        },
        editorPadding: {
            label: { en: 'Padding' },
            type: 'Spacing',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 200 }], noRange: true },
            defaultValue: '12px',
            bindable: true,
            responsive: true,
        },
        editorMinHeight: {
            label: { en: 'Min height' },
            type: 'Length',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 2000 }], noRange: true },
            defaultValue: '160px',
            bindable: true,
            responsive: true,
        },
        editorBorder: {
            label: { en: 'Border' },
            type: 'Border',
            section: 'style',
            states: true,
            classes: true,
            bindable: true,
            responsive: true,
            defaultValue: '1px solid #e5e7eb',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'border', type: 'string', tooltip: 'CSS border shorthand.' },
            /* wwEditor:end */
        },
        editorBorderRadius: {
            label: { en: 'Border radius' },
            type: 'Spacing',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 100 }], isCorner: true, noRange: true },
            defaultValue: '8px',
            bindable: true,
            responsive: true,
        },
        placeholderColor: {
            label: { en: 'Placeholder color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#9ca3af',
            bindable: true,
            responsive: true,
        },

        // ---- Selection menu positioning ----
        menuVerticalPosition: {
            label: { en: 'Vertical position' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'top', label: { en: 'Above selection' } },
                    { value: 'bottom', label: { en: 'Below selection' } },
                ],
            },
            defaultValue: 'top',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Valid values: top | bottom' },
            /* wwEditor:end */
        },
        menuHorizontalPosition: {
            label: { en: 'Horizontal position' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'left', label: { en: 'Align left' } },
                    { value: 'center', label: { en: 'Center' } },
                    { value: 'right', label: { en: 'Align right' } },
                ],
            },
            defaultValue: 'center',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Valid values: left | center | right' },
            /* wwEditor:end */
        },
        menuAutoFlip: {
            label: { en: 'Auto flip if no space' },
            type: 'OnOff',
            section: 'style',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'Flip the menu to the opposite side when it would overflow the viewport.' },
            propertyHelp: { tooltip: 'When ON, if the menu does not fit in the chosen direction it opens on the opposite side.' },
            /* wwEditor:end */
        },

        // ---- Selection menu style ----
        menuBackground: {
            label: { en: 'Menu background' },
            type: 'Color',
            section: 'style',
            defaultValue: '#FFFFFF',
            bindable: true,
            responsive: true,
        },
        menuBorder: {
            label: { en: 'Menu border' },
            type: 'Border',
            section: 'style',
            states: true,
            classes: true,
            bindable: true,
            responsive: true,
            defaultValue: 'none',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'border', type: 'string', tooltip: 'CSS border shorthand.' },
            /* wwEditor:end */
        },
        menuBorderRadius: {
            label: { en: 'Menu radius' },
            type: 'Spacing',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 100 }], isCorner: true, noRange: true },
            defaultValue: '8px',
            bindable: true,
            responsive: true,
        },
        menuPadding: {
            label: { en: 'Menu padding' },
            type: 'Spacing',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 100 }], noRange: true },
            defaultValue: '6px',
            bindable: true,
            responsive: true,
        },
        menuGap: {
            label: { en: 'Menu gap' },
            type: 'Length',
            section: 'style',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 60 }], noRange: true },
            defaultValue: '4px',
            bindable: true,
            responsive: true,
        },
        menuShadow: {
            label: { en: 'Menu shadow' },
            type: 'Shadows',
            section: 'style',
            defaultValue: '0px 8px 24px 0px rgba(0, 0, 0, 0.24)',
            bindable: true,
            responsive: true,
        },
        menuOffsetX: {
            label: { en: 'Menu offset X' },
            section: 'style',
            defaultValue: '0px',
            ...offsetLength,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Horizontal offset of the floating menu, e.g. "8px" or "-12px".' },
            /* wwEditor:end */
        },
        menuOffsetY: {
            label: { en: 'Menu offset Y' },
            section: 'style',
            defaultValue: '0px',
            ...offsetLength,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Vertical offset of the floating menu, e.g. "-8px".' },
            /* wwEditor:end */
        },

        // Shown inside the "Code" group; applies to both code blocks and inline code.
        codeBackground: {
            label: { en: 'Background', fr: 'Fond' },
            type: 'Color',
            section: 'style',
            defaultValue: '#f3f4f6',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'background-color',
                type: 'string',
                tooltip: 'Background color of code blocks and inline code.',
            },
            propertyHelp: { tooltip: 'Background behind both code blocks and inline code.' },
            /* wwEditor:end */
        },

        // ---- Per-element-type content styles ----
        ...contentStyleProperties,
    },
    triggerEvents: [
        { name: 'change', label: { en: 'On change' }, event: { value: '' } },
        { name: 'focus', label: { en: 'On focus' }, event: {} },
        { name: 'blur', label: { en: 'On blur' }, event: {} },
        { name: 'selectionChange', label: { en: 'On selection change' }, event: { text: '' } },
    ],
    actions: [
        { label: { en: 'Toggle bold' }, action: 'toggleBold' },
        { label: { en: 'Toggle italic' }, action: 'toggleItalic' },
        { label: { en: 'Toggle underline' }, action: 'toggleUnderline' },
        { label: { en: 'Toggle strikethrough' }, action: 'toggleStrike' },
        { label: { en: 'Toggle inline code' }, action: 'toggleCode' },
        { label: { en: 'Toggle code block' }, action: 'toggleCodeBlock' },
        { label: { en: 'Toggle bullet list' }, action: 'toggleBulletList' },
        { label: { en: 'Toggle ordered list' }, action: 'toggleOrderedList' },
        { label: { en: 'Toggle quote' }, action: 'toggleBlockquote' },
        { label: { en: 'Set paragraph' }, action: 'setParagraph' },
        {
            label: { en: 'Set heading' },
            action: 'setHeading',
            args: [{ name: 'level', type: 'number', label: { en: 'Level (1-6)' } }],
        },
        {
            label: { en: 'Set text color' },
            action: 'setColor',
            args: [{ name: 'color', type: 'string', label: { en: 'Color (hex or CSS color)' } }],
        },
        { label: { en: 'Clear text color' }, action: 'unsetColor' },
        {
            label: { en: 'Set font family' },
            action: 'setFontFamily',
            args: [{ name: 'family', type: 'string', label: { en: 'Font family' } }],
        },
        {
            label: { en: 'Set link' },
            action: 'setLink',
            args: [{ name: 'href', type: 'string', label: { en: 'URL' } }],
        },
        { label: { en: 'Remove link' }, action: 'unsetLink' },
        { label: { en: 'Clear formatting' }, action: 'clearFormatting' },
        { label: { en: 'Focus editor' }, action: 'focus' },
        { label: { en: 'Close toolbar' }, action: 'closeToolbar' },
    ],
};
