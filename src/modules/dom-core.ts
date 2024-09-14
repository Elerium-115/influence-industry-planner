function createEl(
    nodeType: string,
    id: string|null = null,
    classes: string[]|null = null
): HTMLElement {
    const el = document.createElement(nodeType);
    if (id) {
        el.id = id;
    }
    if (classes) {
        classes.forEach(className => el.classList.add(className));
    }
    return el;
}

export {
    createEl,
}
