<template>
    <loader v-if="loading == true" v-bind:loadingText="loadingText" />
    <section id="pdfPreview">
        <div class="container">
            <div class="flex flex-row items-start flex-wrap lg:flex-nowrap">
                <div class="w-full max-w-md text-white px-5 py-7 bg-gray-800 border-2 border-primary-500 sticky top-0">
                    <div class="fileSelectorBox flex flex-col">
                        <label for="selectFile">Select PDF:</label>
                        <!-- <input type="file" id="uploadedFiles" @change="loadPDF" class="px-4 bg-blue-500 text-white rounded-lg"
                                accept="application/pdf" /> -->
                        <input type="file" name="uploadedFiles" id="uploadedFiles" @change="loadPDF"
                            class="rounded-lg border-2 outline-none focus:ring-0 border-primary-500 focus:border-primary-700 bg-transparent text-white px-3.5 leading-4 file:bg-primary-500 file:focus:bg-primary-700 transition-all"
                            accept="application/pdf" />
                    </div>
                    <div class="flex justify-center items-center mt-10 text-center gap-5">
                        <span class="text-lg">Page</span>
                        <input type="number" id="current_page" v-model.number="currentPage" disabled min="1"
                            :max="totalPages" @keypress.enter="randomPage(currentPage)"
                            class="w-20 rounded-lg outline-none focus:ring-0 border-primary-500 focus:border-primary-700 bg-transparent text-white px-3.5 leading-4" />
                        <span class="text-lg">of</span>
                        <input type="number" id="totalNumber" :value="totalPages" disabled
                            class="w-20 rounded-lg outline-none focus:ring-0 border-primary-500 focus:border-primary-700 bg-transparent text-white px-3.5 leading-4" />
                    </div>
                    <div class="flex justify-center items-center mt-10 text-center gap-5">
                        <button @click="goToPage(-1)" id="prevBtn" :disabled="!pdf || currentPage == 1"
                            class="text-white font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 border-primary-500 bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Previous
                        </button>
                        <button @click="goToPage(+1)" id="nextBtn" :disabled="!pdf || currentPage == totalPages"
                            class="text-white font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 border-primary-500 bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                    <div class="downloadBox text-center mt-10">
                        <a v-if="downloadImage != null" :href="downloadImage"
                            class="text-white font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 border-primary-500 bg-primary-600 hover:bg-primary-700 focus:outline-none"
                            id="downloadImage" download="image.png">Download Image</a>
                    </div>
                </div>
                <div id="pdfPreviewCover" class="w-full max-w-4xl overflow-hidden overflow-y-auto px-5 flex justify-center">
                    <a :href="downloadImage" data-fancybox="PDFPreview">
                        <canvas id="pdf_renderer" class="mx-auto max-w-full h-full"></canvas>
                    </a>
                </div>
                <div id="generateThumbPreview"
                    class="w-full max-w-[160px] flex flex-col gap-y-3 overflow-hidden overflow-y-auto text-white">
                    <div class="w-40 relative z-0" v-for="(thumbnail, i) in thumbnails" :key="i">
                        <a :href="thumbnail" @click.prevent="randomPage(i + 1)"
                            class=" min-h-[40px] bg-purple-400 block">
                            <img :src="thumbnail" class="w-full" />
                            <span class="absolute z-10 top-2 right-2 bg-primary-800 shadow-md shadow-gray-900 w-7 h-7 flex justify-center items-center rounded-full">{{ i + 1 }}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
  
<script>
import * as pdfjsLib from 'pdfjs-dist';
import loader from "../components/loader.vue";
import { toRaw } from 'vue';
import { Fancybox } from '@fancyapps/ui/dist/fancybox/fancybox.esm.js';
import '@fancyapps/ui/dist/fancybox/fancybox.css';


export default {
    name: 'PdfViewer',
    data() {
        return {
            pdf: null,
            currentPage: 0,
            totalPages: 0,
            zoom: 1,
            loading: false,
            loadingText: null,
            randomPageNumber: 0,
            downloadImage: null,
            thumbnails: []
        }
    },
    components: {
        loader,
    },
    mounted() {

        document.title = "PDF Preview";

        const pdfjsWorker = import('pdfjs-dist/build/pdf.worker.entry');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        function pageHeight() {
            let bodyHeight = window.innerHeight;
            let pdfPreview = document.getElementById("pdfPreview");
            let pdfPreviewCover = document.getElementById("pdfPreviewCover");
            let generateThumbPreview = document.getElementById("generateThumbPreview");
            pdfPreview.style.height = bodyHeight + "px";
            pdfPreviewCover.style.height = bodyHeight + "px";
            generateThumbPreview.style.height = bodyHeight + "px";
        }
        pageHeight();
        window.addEventListener('resize', function () {
            pageHeight();
        }, true);

        document.addEventListener('keydown', (event) => {
            if (event.code === 'ArrowLeft') {
                // Handle left arrow key press
                if (this.currentPage != 0) {
                    this.goToPage(-1)
                }
            } else if (event.code === 'ArrowRight') {
                // Handle right arrow key press
                if (this.currentPage != this.totalPages) {
                    this.goToPage(+1)
                }
            }
        });
    },
    methods: {
        async render() {
            if (!this.pdf) {
                return;
            }
            Fancybox.unbind('[data-fancybox]');

            toRaw(this.pdf).getPage(this.currentPage).then((page) => {
                const canvas = document.getElementById('pdf_renderer');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                const viewport = page.getViewport({ scale: this.zoom * 2 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport,
                };
                const renderTask = page.render(renderContext);

                renderTask.promise.then(() => {
                    this.totalPages = this.pdf.numPages;
                    // this.loading = false;
                    if (this.pdf.numPages == this.currentPage) {
                        document.getElementById("nextBtn").setAttribute("disabled", "disabled")
                    } else {
                        document.getElementById("nextBtn").removeAttribute("disabled")
                    }
                    // setTimeout(() => {
                    // var pdf_renderer = document.getElementById("pdf_renderer");
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        this.downloadImage = url;
                    })
                    Fancybox.bind('[data-fancybox]', {
                        Toolbar: {
                            display: {
                                left: ["infobar"],
                                middle: [],
                                right: [
                                    "zoom",
                                    "fullscreen",
                                    "close",
                                ],
                            },
                        },
                    });
                    Fancybox.defaults.Hash = false;
                });
            });
        },

        async generateThumbnails() {
            if (!this.pdf) {
                return;
            }

            this.thumbnails = [];
            setTimeout(() => {
                this.loading = true;
                this.loadingText = "Thumbnails are loading"
            }, 100);

            const numPages = this.pdf.numPages;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Loop through all pages of the PDF and render each page to a canvas element
            const promises = [];
            for (let i = 1; i <= numPages; i++) {
                const page = await toRaw(this.pdf).getPage(i);
                const viewport = page.getViewport({ scale: this.zoom });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;

                // Capture canvas data as an image and use it as the thumbnail for this page
                const promise = new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        resolve(url);
                    });
                });
                promises.push(promise);
            }
            this.thumbnails = await Promise.all(promises);
            this.loading = false;
            this.loadingText = null;
        },


        loadPDF(e) {
            if (e.target.files[0] == null) {
                return;
            }
            this.loading = true;
            this.loadingText = "PDF is loading";
            const selectedFile = e.target.files[0];
            const objectURL = window.URL.createObjectURL(selectedFile);
            
            pdfjsLib.getDocument(objectURL).promise.then((pdf) => {
                this.pdf = pdf;
                this.render();
                this.generateThumbnails();
                this.loading = false;
            });
            this.currentPage = 1;
        },

        loaderWaitFalse() {
            setTimeout(() => {
                this.loading = false;
            }, 100);
        },

        goToPage(pageCount) {
            this.loading = true;
            if (pageCount == 1) {
                this.currentPage += 1;
                this.render();
                this.loaderWaitFalse();
            } else if (pageCount == -1) {
                this.currentPage -= 1;
                this.render();
                this.loaderWaitFalse();
            } else {
                this.loaderWaitFalse();
            }
        },

        randomPage(randomPage) {
            this.loading = true;
            if (this.pdf.numPages <= randomPage-1) {
                randomPage = this.pdf.numPages;
                this.render();
                this.loaderWaitFalse();
            } else {
                this.currentPage = randomPage;
                this.render();
                this.loaderWaitFalse();
            }
        },
    },
}
</script>
  