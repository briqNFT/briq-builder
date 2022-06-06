
export function useBooklet() {
    const getImgSrc = (booklet: string, page: number) => `/${booklet}/step_${page - 1}.png`;

    return {
        getImgSrc
    };
};
