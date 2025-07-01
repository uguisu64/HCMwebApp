export const calcNomal = `
import numpy as np

np.random.seed(seed)

points = np.random.normal(loc=loc, scale=scale, size=size)

points
`

export const calcUniform = `
import numpy as np

np.random.seed(seed)

points = np.random.uniform(low=low, high=high, size=size)

points
`

export const calcLaplace = `
import numpy as np

np.random.seed(seed)

points = np.random.laplace(loc=loc, scale=scale, size=size)

points
`

export const calcExp = `
import numpy as np

np.random.seed(seed)

points = np.random.exponential(scale=scale, size=size)

points
`

export const calcGamma = `
import numpy as np

np.random.seed(seed)

points = np.random.gamma(shape=shape, scale=scale, size=size)

points
`

export const calcBeta = `
import numpy as np

np.random.seed(seed)

points = np.random.beta(a=a, b=b, size=size)

points
`

export const calcChisquare = `
import numpy as np

np.random.seed(seed)

points = np.random.chisquare(df=df, size=size)

points
`

export const makeBlob = `
from sklearn.datasets import make_blobs

points, label = make_blobs(n_samples=size, centers=[[centerX, centerY]], 
                    cluster_std=[std], random_state=seed)

ret = {"x": points[:, 0], "y": points[:, 1]}
ret
`
