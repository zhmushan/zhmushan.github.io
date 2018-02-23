class Flexbox extends HTMLElement {

    private _innerElt = document.createElement('mu-flexbox-inner')

    private _content = ''
    set content(content: string) { this._content = content }
    get content() { return this._content }

    get diffWidth() { return this.offsetWidth - this._innerElt.offsetWidth }

    notice() {
        this.style.paddingLeft = `${this.diffWidth / 2}px`
    }

    init() {
        this.content = this.innerHTML
        this.innerText = ''
        this._innerElt.innerHTML = this.content
        this.appendChild(this._innerElt)
    }

    constructor() {
        super()
        this.init()
        this.notice()
    }
}
customElements.define('mu-flexbox', Flexbox)