all: 
	pdflatex -shell-escape main.tex
	bibtex main
	pdflatex -shell-escape main.tex
	pdflatex -shell-escape main.tex

clean:
	rm -f *.dvi *.ps *.aux *.log *.bbl *.blg
